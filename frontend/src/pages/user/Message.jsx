import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Message.css';

// Mock data
const mockContacts = [
  { id: 1, name: 'Trần Văn B', role: 'Chủ trọ', avatar: 'T', room: 'Phòng trọ 15 Tạ Quang Bửu', lastMsg: 'Phòng vẫn còn trống bạn nhé!', time: '10:30', unread: 2, online: true },
  { id: 2, name: 'Lê Thị C',   role: 'Chủ trọ', avatar: 'L', room: 'Chung cư mini 88 Láng Hạ',  lastMsg: 'Bạn có thể đến xem phòng lúc 3h chiều', time: 'Hôm qua', unread: 0, online: false },
  { id: 3, name: 'Phạm Văn D', role: 'Chủ trọ', avatar: 'P', room: 'Nhà nguyên căn Thanh Xuân',  lastMsg: 'Giá thuê có thể thương lượng', time: 'T2', unread: 0, online: true },
];

const mockMessages = {
  1: [
    { id: 1, from: 'them', text: 'Xin chào! Bạn quan tâm đến phòng trọ của mình à?', time: '10:00', type: 'text' },
    { id: 2, from: 'me',   text: 'Vâng, mình muốn hỏi thêm về phòng ạ', time: '10:05', type: 'text' },
    { id: 3, from: 'them', text: 'Phòng 25m², đầy đủ nội thất, giá 3.5 triệu/tháng', time: '10:10', type: 'text' },
    { id: 4, from: 'them', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300&h=200&fit=crop', time: '10:12', type: 'image' },
    { id: 5, from: 'me',   text: 'Phòng trông đẹp đấy! Còn trống không ạ?', time: '10:20', type: 'text' },
    { id: 6, from: 'them', text: 'Phòng vẫn còn trống bạn nhé!', time: '10:30', type: 'text' },
  ],
  2: [
    { id: 1, from: 'me',   text: 'Cho mình hỏi phòng còn trống không ạ?', time: 'Hôm qua', type: 'text' },
    { id: 2, from: 'them', text: 'Bạn có thể đến xem phòng lúc 3h chiều', time: 'Hôm qua', type: 'text' },
  ],
  3: [
    { id: 1, from: 'them', text: 'Giá thuê có thể thương lượng', time: 'T2', type: 'text' },
  ],
};

export default function Message({ user, onLogout }) {
  const [activeId, setActiveId]   = useState(1);
  const [messages, setMessages]   = useState(mockMessages);
  const [contacts, setContacts]   = useState(mockContacts);
  const [input, setInput]         = useState('');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  const active = contacts.find(c => c.id === activeId);
  const msgs   = messages[activeId] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, messages]);

  // Đánh dấu đã đọc khi chọn contact
  const selectContact = (id) => {
    setActiveId(id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = { id: Date.now(), from: 'me', text: input.trim(), time: 'Vừa xong', type: 'text' };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), msg] }));
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: input.trim(), time: 'Vừa xong' } : c));
    setInput('');
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const msg = { id: Date.now(), from: 'me', image: url, time: 'Vừa xong', type: 'image' };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), msg] }));
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: '📷 Hình ảnh', time: 'Vừa xong' } : c));
    e.target.value = '';
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div className="msg-page">
      {/* NAVBAR */}
      <nav className="msg-nav">
        <div className="msg-nav-inner">
          <Link to="/" className="msg-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="msg-nav-links">
            <Link to="/"        className="msg-nav-link">Trang chủ</Link>
            <Link to="/search"  className="msg-nav-link">Tìm phòng</Link>
            <Link to="/message" className="msg-nav-link active">Tin nhắn</Link>
          </div>
          <div className="msg-nav-right">
            {user ? (
              <div className="msg-nav-user">
                <button className="msg-nav-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="msg-nav-avatar">{user.name?.charAt(0)}</div>
                  <span>{user.name}</span> <span>▾</span>
                </button>
                {menuOpen && (
                  <div className="msg-nav-dropdown">
                    <Link to="/profile" className="msg-nav-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                    <hr className="msg-nav-drop-hr" />
                    <button className="msg-nav-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); }}>🚪 Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="msg-nav-btn">Đăng nhập</Link>
            )}
          </div>
        </div>
      </nav>

      <div className="msg-body">
        {/* CONTACT LIST */}
        <aside className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h2>Tin nhắn</h2>
            <span className="msg-total">{contacts.reduce((s, c) => s + c.unread, 0) > 0 && contacts.reduce((s, c) => s + c.unread, 0)}</span>
          </div>
          <div className="msg-search">
            <span>🔍</span>
            <input type="text" placeholder="Tìm cuộc trò chuyện..." />
          </div>
          <div className="msg-contact-list">
            {contacts.map(c => (
              <div key={c.id} className={`msg-contact ${activeId === c.id ? 'active' : ''}`}
                onClick={() => selectContact(c.id)}>
                <div className="msg-contact-avatar-wrap">
                  <div className="msg-contact-avatar">{c.avatar}</div>
                  {c.online && <span className="msg-online-dot" />}
                </div>
                <div className="msg-contact-info">
                  <div className="msg-contact-top">
                    <span className="msg-contact-name">{c.name}</span>
                    <span className="msg-contact-time">{c.time}</span>
                  </div>
                  <p className="msg-contact-last">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && <span className="msg-unread-badge">{c.unread}</span>}
              </div>
            ))}
          </div>
        </aside>

        {/* CHAT AREA */}
        <main className="msg-chat">
          {/* Chat header */}
          <div className="msg-chat-header">
            <div className="msg-chat-header-left">
              <div className="msg-chat-avatar-wrap">
                <div className="msg-chat-avatar">{active?.avatar}</div>
                {active?.online && <span className="msg-online-dot" />}
              </div>
              <div>
                <p className="msg-chat-name">{active?.name}</p>
                <p className="msg-chat-sub">{active?.online ? '🟢 Đang hoạt động' : '⚫ Offline'} · {active?.room}</p>
              </div>
            </div>
            <div className="msg-chat-header-right">
              <button className="msg-header-btn" title="Gọi điện">📞</button>
              <button className="msg-header-btn" title="Thông tin">ℹ️</button>
            </div>
          </div>

          {/* Messages */}
          <div className="msg-messages">
            {msgs.map(msg => (
              <div key={msg.id} className={`msg-row ${msg.from === 'me' ? 'me' : 'them'}`}>
                {msg.from === 'them' && (
                  <div className="msg-bubble-avatar">{active?.avatar}</div>
                )}
                <div className="msg-bubble-wrap">
                  {msg.type === 'text' ? (
                    <div className={`msg-bubble ${msg.from === 'me' ? 'me' : 'them'}`}>
                      {msg.text}
                    </div>
                  ) : (
                    <div className="msg-bubble-img" onClick={() => setImgPreview(msg.image)}>
                      <img src={msg.image} alt="img" />
                    </div>
                  )}
                  <span className="msg-time">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="msg-input-bar">
            <button className="msg-attach-btn" onClick={() => fileRef.current.click()} title="Gửi ảnh">
              📷
            </button>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={sendImage} />

            <div className="msg-input-wrap">
              <textarea
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />
            </div>

            <button className="msg-send-btn" onClick={sendMessage} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </main>
      </div>

      {/* Image preview modal */}
      {imgPreview && (
        <div className="msg-img-modal" onClick={() => setImgPreview(null)}>
          <img src={imgPreview} alt="preview" />
          <button className="msg-img-close">✕</button>
        </div>
      )}
    </div>
  );
}
