import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  getConversationsApi,
  getMessagesApi,
  sendMessageApi,
} from '../../api/messages';
import './Message.css';

const ROLE_LABEL = { user: 'Người thuê', employer: 'Chủ trọ', admin: 'Quản trị viên' };

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function Message({ user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [searchParams]                    = useSearchParams();

  const bottomRef   = useRef(null);
  const socketRef   = useRef(null);
  const activeIdRef = useRef(null); // ref để dùng trong socket callback
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
      // Chỉ xử lý tin từ đối phương, tin của mình đã được add khi gửi
      if (message.ma_nguoi_gui === user.id) return;

      if (ma_ctc === activeIdRef.current) {
        setMessages(prev => [...prev, message]);
      }
      // Cập nhật preview sidebar
      setConversations(prev =>
        prev.map(c => c.ma_ctc === ma_ctc
          ? { ...c, tin_nhan_cuoi: message.noi_dung, thoi_gian_cuoi: message.ngay_tao,
              chua_doc: ma_ctc === activeIdRef.current ? 0 : (c.chua_doc || 0) + 1 }
          : c
        ).sort((a, b) => new Date(b.thoi_gian_cuoi) - new Date(a.thoi_gian_cuoi))
      );
    });

    // Conversation mới xuất hiện (đối phương nhắn lần đầu)
    socket.on('conversation_updated', ({ ma_ctc }) => {
      // Reload danh sách để lấy conversation mới nếu chưa có
      setConversations(prev => {
        if (prev.some(c => c.ma_ctc === ma_ctc)) return prev;
        // Fetch lại danh sách
        getConversationsApi().then(list => setConversations(list)).catch(() => {});
        return prev;
      });
    });

    return () => { socket.disconnect(); };
  }, [user]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    getConversationsApi()
      .then(list => {
        setConversations(list);
        const cid = searchParams.get('conversationId');
        if (cid) setActiveId(Number(cid));
        else if (list.length) setActiveId(list[0].ma_ctc);
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
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    try {
      const msg = await sendMessageApi(activeId, text);
      // Thêm tin thật vào UI (không dùng optimistic để tránh duplicate với socket)
      setMessages(prev => [...prev, { ...msg, noi_dung: text, ma_nguoi_gui: user.id }]);
      setConversations(prev =>
        prev.map(c => c.ma_ctc === activeId
          ? { ...c, tin_nhan_cuoi: text, thoi_gian_cuoi: msg.ngay_tao }
          : c
        ).sort((a, b) => new Date(b.thoi_gian_cuoi) - new Date(a.thoi_gian_cuoi))
      );
    } catch (err) {
      console.error(err);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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

              <div className="msg-messages">
                {messages.map(msg => (
                  <div key={msg.ma_tn} className={`msg-row ${msg.ma_nguoi_gui === user?.id ? 'me' : 'them'}`}>
                    {msg.ma_nguoi_gui !== user?.id && (
                      <div className="msg-bubble-avatar">
                        {activeConv.avatar_doi_phuong
                          ? <img src={activeConv.avatar_doi_phuong} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : activeConv.ten_doi_phuong?.charAt(0)}
                      </div>
                    )}
                    <div className="msg-bubble-wrap">
                      <div className={`msg-bubble ${msg.ma_nguoi_gui === user?.id ? 'me' : 'them'}`}>
                        {msg.noi_dung}
                      </div>
                      <span className="msg-time">{formatTime(msg.ngay_tao)}</span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="msg-input-bar">
                <div className="msg-input-wrap">
                  <textarea
                    placeholder="Nhập tin nhắn..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                  />
                </div>
                <button className="msg-send-btn" onClick={sendMessage} disabled={!input.trim() || sending}>➤</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
