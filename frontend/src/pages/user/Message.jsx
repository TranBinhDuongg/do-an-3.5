import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  getConversationsApi,
  getMessagesApi,
  sendMessageApi,
  deleteMessageApi,
} from '../../api/messages';
import './Message.css';

const ROLE_LABEL = { user: 'Người thuê', employer: 'Chủ trọ', admin: 'Quản trị viên' };

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString())
    return 'Hôm qua ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [msgMenu, setMsgMenu]             = useState(null); // { ma_tn, x, y }
  const [imagePreview, setImagePreview]   = useState(null); // object URL để preview
  const [imageFile, setImageFile]         = useState(null); // File gốc để convert khi gửi
  const [searchParams]                    = useSearchParams();

  const bottomRef   = useRef(null);
  const socketRef   = useRef(null);
  const activeIdRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate    = useNavigate();

  // Sync activeId vào ref
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const backPath = user?.role === 'employer' ? '/employer' : '/';

  // Khởi tạo socket
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    // Nhận tin nhắn mới trong conversation đang mở
    socket.on('new_message', ({ ma_ctc, message }) => {
      if (message.ma_nguoi_gui === user.id) return;

      if (ma_ctc === activeIdRef.current) {
        // Nếu có ảnh, reload messages để lấy base64 thật từ server
        if (message.anh_url === '[has_image]') {
          getMessagesApi(ma_ctc).then(msgs => setMessages(msgs)).catch(() => {});
        } else {
          setMessages(prev => [...prev, message]);
        }
      }
      setConversations(prev =>
        prev.map(c => c.ma_ctc === ma_ctc
          ? { ...c, tin_nhan_cuoi: message.noi_dung, thoi_gian_cuoi: message.ngay_tao,
              chua_doc: ma_ctc === activeIdRef.current ? 0 : (c.chua_doc || 0) + 1 }
          : c
        ).sort((a, b) => new Date(b.thoi_gian_cuoi) - new Date(a.thoi_gian_cuoi))
      );
    });

    // Tin nhắn bị xóa
    socket.on('message_deleted', ({ ma_tn }) => {
      setMessages(prev => prev.filter(m => m.ma_tn !== ma_tn));
    });

    // Conversation mới xuất hiện (đối phương nhắn lần đầu)
    socket.on('conversation_updated', ({ ma_ctc }) => {      setConversations(prev => {
        if (prev.some(c => c.ma_ctc === ma_ctc)) return prev;
        getConversationsApi().then(list => {
          const seen = new Set();
          const deduped = list.filter(c => {
            if (seen.has(c.ma_doi_phuong)) return false;
            seen.add(c.ma_doi_phuong);
            return true;
          });
          setConversations(deduped);
        }).catch(() => {});
        return prev;
      });
    });

    return () => { socket.disconnect(); };
  }, [user]);

  // Load conversations — deduplicate theo đối phương, giữ conversation mới nhất
  useEffect(() => {
    if (!user) return;
    getConversationsApi()
      .then(list => {
        // Giữ 1 conversation mới nhất cho mỗi đối phương
        const seen = new Set();
        const deduped = list.filter(c => {
          if (seen.has(c.ma_doi_phuong)) return false;
          seen.add(c.ma_doi_phuong);
          return true;
        });
        setConversations(deduped);
        const cid = searchParams.get('conversationId');
        if (cid) setActiveId(Number(cid));
        else if (deduped.length) setActiveId(deduped[0].ma_ctc);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Load messages + join socket room khi đổi conversation
  useEffect(() => {
    if (!activeId) return;
    const socket = socketRef.current;

    // Leave room cũ, join room mới
    if (socket) {
      socket.emit('leave_conversation', activeIdRef.current);
      socket.emit('join_conversation', activeId);
    }

    getMessagesApi(activeId)
      .then(msgs => {
        setMessages(msgs);
        setConversations(prev =>
          prev.map(c => c.ma_ctc === activeId ? { ...c, chua_doc: 0 } : c)
        );
      })
      .catch(console.error);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find(c => c.ma_ctc === activeId);

  const sendMessage = async () => {
    if ((!input.trim() && !imageFile) || sending) return;
    const text = input.trim();
    const file = imageFile;
    const previewUrl = imagePreview;
    setInput('');
    setImagePreview(null);
    setImageFile(null);
    setSending(true);

    try {
      // Convert file sang base64 chỉ khi gửi
      let anh_url = null;
      if (file) {
        anh_url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const msg = await sendMessageApi(activeId, { noi_dung: text || undefined, anh_url: anh_url || undefined });

      const now = msg.ngay_tao;
      const newMsgs = [];

      // Nếu có ảnh, thêm bubble ảnh trước
      if (anh_url) {
        newMsgs.push({
          ma_tn: msg.ma_tn,
          ma_nguoi_gui: user.id,
          loai: 'image',
          anh_url,
          noi_dung: '[Hình ảnh]',
          ngay_tao: now,
        });
      }
      // Nếu có text, thêm bubble text sau
      if (text) {
        newMsgs.push({
          ma_tn: anh_url ? msg.ma_tn + 0.1 : msg.ma_tn, // key tạm
          ma_nguoi_gui: user.id,
          loai: 'text',
          anh_url: null,
          noi_dung: text,
          ngay_tao: now,
        });
      }

      const preview = text ? (anh_url ? `🖼 ${text}` : text) : '[Hình ảnh]';
      setMessages(prev => [...prev, ...newMsgs]);
      setConversations(prev =>
        prev.map(c => c.ma_ctc === activeId
          ? { ...c, tin_nhan_cuoi: preview, thoi_gian_cuoi: now }
          : c
        ).sort((a, b) => new Date(b.thoi_gian_cuoi) - new Date(a.thoi_gian_cuoi))
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error(err);
      setInput(text);
      setImageFile(file);
      setImagePreview(previewUrl);
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Ảnh tối đa 5MB'); return; }
    // Dùng object URL để preview — nhẹ, không crash
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
    e.target.value = '';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleDeleteMsg = async (ma_tn) => {
    setMsgMenu(null);
    try {
      await deleteMessageApi(activeId, ma_tn);
      setMessages(prev => prev.filter(m => m.ma_tn !== ma_tn));
    } catch (err) {
      console.error(err);
    }
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.chua_doc || 0), 0);

  return (
    <div className="msg-page">
      {/* NAVBAR */}
      <nav className="msg-nav">
        <div className="msg-nav-inner">
          <Link to="/" className="msg-nav-logo">🏠 ThueNha<span>VN</span></Link>
          <div className="msg-nav-right">
            <Link to={backPath} className="msg-nav-back">← Quay lại</Link>
            {user && (
              <div className="msg-nav-user-wrap">
                <button className="msg-nav-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="msg-nav-avatar">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="avatar" />
                      : user.name?.charAt(0)}
                  </div>
                  <div className="msg-nav-user-info">
                    <span className="msg-nav-user-name">{user.name}</span>
                    <span className="msg-nav-user-role">{ROLE_LABEL[user.role] || user.role}</span>
                  </div>
                  <span className="msg-nav-caret">▾</span>
                </button>
                {menuOpen && (
                  <div className="msg-nav-dropdown">
                    <Link to="/profile" className="msg-nav-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                    <hr className="msg-nav-drop-hr" />
                    <button className="msg-nav-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); navigate('/login'); }}>
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="msg-body">
        {/* SIDEBAR */}
        <aside className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h2>Tin nhắn</h2>
            {totalUnread > 0 && <span className="msg-total">{totalUnread}</span>}
          </div>
          <div className="msg-search">
            <span>🔍</span>
            <input type="text" placeholder="Tìm cuộc trò chuyện..." />
          </div>
          <div className="msg-contact-list">
            {loading && <p className="msg-loading-text">Đang tải...</p>}
            {!loading && conversations.length === 0 && (
              <p className="msg-empty-text">Chưa có cuộc trò chuyện nào.</p>
            )}
            {conversations.map(c => (
              <div key={c.ma_ctc}
                className={`msg-contact ${activeId === c.ma_ctc ? 'active' : ''}`}
                onClick={() => setActiveId(c.ma_ctc)}>
                <div className="msg-contact-avatar-wrap">
                  <div className="msg-contact-avatar">
                    {c.avatar_doi_phuong
                      ? <img src={c.avatar_doi_phuong} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : c.ten_doi_phuong?.charAt(0)}
                  </div>
                </div>
                <div className="msg-contact-info">
                  <div className="msg-contact-top">
                    <span className="msg-contact-name">{c.ten_doi_phuong}</span>
                    <span className="msg-contact-time">{formatTime(c.thoi_gian_cuoi)}</span>
                  </div>
                  <p className="msg-contact-last">{c.tin_nhan_cuoi || c.ten_phong || '...'}</p>
                </div>
                {c.chua_doc > 0 && <span className="msg-unread-badge">{c.chua_doc}</span>}
              </div>
            ))}
          </div>
        </aside>

        {/* CHAT AREA */}
        <main className="msg-chat">
          {!activeConv ? (
            <div className="msg-empty-chat">
              <p>💬 Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          ) : (
            <>
              <div className="msg-chat-header">
                <div className="msg-chat-header-left">
                  <div className="msg-chat-avatar-wrap">
                    <div className="msg-chat-avatar">
                      {activeConv.avatar_doi_phuong
                        ? <img src={activeConv.avatar_doi_phuong} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : activeConv.ten_doi_phuong?.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="msg-chat-name">{activeConv.ten_doi_phuong}</p>
                    <p className="msg-chat-sub">
                      {ROLE_LABEL[activeConv.vai_tro_doi_phuong] || activeConv.vai_tro_doi_phuong}
                      {activeConv.ten_phong && ` · ${activeConv.ten_phong}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="msg-messages" onClick={() => setMsgMenu(null)}>
                {messages.map((msg, idx) => {
                  const next = messages[idx + 1];
                  const isLastInGroup = !next || next.ma_nguoi_gui !== msg.ma_nguoi_gui;
                  const isMe = msg.ma_nguoi_gui === user?.id;
                  return (
                    <div key={msg.ma_tn} className={`msg-row ${isMe ? 'me' : 'them'}`}>
                      {!isMe && (
                        <div className={`msg-bubble-avatar ${isLastInGroup ? '' : 'invisible'}`}>
                          {activeConv.avatar_doi_phuong
                            ? <img src={activeConv.avatar_doi_phuong} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : activeConv.ten_doi_phuong?.charAt(0)}
                        </div>
                      )}
                      <div className="msg-bubble-wrap">
                        <div className="msg-bubble-row">
                          {/* Nút action — chỉ hiện khi hover */}
                          {isMe && (
                            <button
                              className="msg-action-btn"
                              onClick={e => { e.stopPropagation(); setMsgMenu(msgMenu?.ma_tn === msg.ma_tn ? null : { ma_tn: msg.ma_tn }); }}
                            >•••</button>
                          )}
                          <div className={`msg-bubble ${isMe ? 'me' : 'them'} ${msg.loai === 'image' ? 'image' : ''}`}>
                            {msg.loai === 'image' && (
                              <img src={msg.anh_url} alt="ảnh" className="msg-img" onClick={() => window.open(msg.anh_url, '_blank')} />
                            )}
                            {msg.noi_dung && msg.noi_dung !== '[Hình ảnh]' && (
                              <span className={msg.loai === 'image' ? 'msg-img-caption' : ''}>{msg.noi_dung}</span>
                            )}
                          </div>
                          {!isMe && (
                            <button
                              className="msg-action-btn"
                              onClick={e => { e.stopPropagation(); setMsgMenu(msgMenu?.ma_tn === msg.ma_tn ? null : { ma_tn: msg.ma_tn }); }}
                            >•••</button>
                          )}
                        </div>
                        {/* Context menu */}
                        {msgMenu?.ma_tn === msg.ma_tn && (
                          <div className={`msg-context-menu ${isMe ? 'me' : 'them'}`} onClick={e => e.stopPropagation()}>
                            {isMe && (
                              <button className="msg-context-delete" onClick={() => handleDeleteMsg(msg.ma_tn)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                                Xóa tin nhắn
                              </button>
                            )}
                          </div>
                        )}
                        {isLastInGroup && (
                          <span className="msg-time">{formatTime(msg.ngay_tao)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="msg-input-bar">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
                <button
                  className="msg-img-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Gửi ảnh"
                  disabled={sending}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>
                <div className="msg-input-wrap">
                  {imagePreview && (
                    <div className="msg-input-img-preview">
                      <img src={imagePreview} alt="preview" />
                      <button className="msg-input-img-remove" onClick={() => {
                        URL.revokeObjectURL(imagePreview);
                        setImagePreview(null);
                        setImageFile(null);
                      }}>✕</button>
                    </div>
                  )}
                  <textarea
                    placeholder={imagePreview ? 'Thêm chú thích... (tuỳ chọn)' : 'Nhập tin nhắn...'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                  />
                </div>
                <button className="msg-send-btn" onClick={sendMessage} disabled={(!input.trim() && !imageFile) || sending}>➤</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
