import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ChatBubble.css';

const mockContacts = [
  { id: 1, name: 'Trần Văn B', avatar: 'T', lastMsg: 'Phòng vẫn còn trống bạn nhé!', time: '10:30', unread: 2, online: true },
  { id: 2, name: 'Lê Thị C',   avatar: 'L', lastMsg: 'Bạn có thể đến xem phòng lúc 3h', time: 'Hôm qua', unread: 0, online: false },
];

const mockMessages = {
  1: [
    { id: 1, from: 'them', text: 'Xin chào! Bạn quan tâm đến phòng của mình à?', time: '10:00', type: 'text' },
    { id: 2, from: 'me',   text: 'Vâng, phòng còn trống không ạ?', time: '10:05', type: 'text' },
    { id: 3, from: 'them', text: 'Phòng vẫn còn trống bạn nhé!', time: '10:30', type: 'text' },
  ],
  2: [
    { id: 1, from: 'them', text: 'Bạn có thể đến xem phòng lúc 3h chiều', time: 'Hôm qua', type: 'text' },
  ],
};

export default function ChatBubble() {
  const [open, setOpen]         = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput]       = useState('');
  const [contacts, setContacts] = useState(mockContacts);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);
  const msgs = activeId ? (messages[activeId] || []) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, messages]);

  const selectContact = (id) => {
    setActiveId(id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const sendMessage = () => {
    if (!input.trim() || !activeId) return;
    const msg = { id: Date.now(), from: 'me', text: input.trim(), time: 'Vừa xong', type: 'text' };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), msg] }));
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: input.trim(), time: 'Vừa xong' } : c));
    setInput('');
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file || !activeId) return;
    const url = URL.createObjectURL(file);
    const msg = { id: Date.now(), from: 'me', image: url, time: 'Vừa xong', type: 'image' };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), msg] }));
    setContacts(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: '📷 Hình ảnh', time: 'Vừa xong' } : c));
    e.target.value = '';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const active = contacts.find(c => c.id === activeId);

  return (
    <div className="cb-wrap">
      {/* Chat window */}
      {open && (
        <div className="cb-window">
          {/* Header */}
          <div className="cb-header">
            {activeId ? (
              <>
                <button className="cb-back" onClick={() => setActiveId(null)}>←</button>
                <div className="cb-header-avatar">{active?.avatar}</div>
                <div className="cb-header-info">
                  <p className="cb-header-name">{active?.name}</p>
                  <p className="cb-header-status">{active?.online ? '🟢 Đang hoạt động' : '⚫ Offline'}</p>
                </div>
              </>
            ) : (
              <p className="cb-header-title">💬 Tin nhắn</p>
            )}
            <div className="cb-header-actions">
              {activeId && (
                <Link to="/message" className="cb-expand" title="Mở rộng" onClick={() => setOpen(false)}>⤢</Link>
              )}
              <button className="cb-close" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* Contact list */}
          {!activeId && (
            <div className="cb-contacts">
              {contacts.map(c => (
                <div key={c.id} className="cb-contact" onClick={() => selectContact(c.id)}>
                  <div className="cb-contact-av-wrap">
                    <div className="cb-contact-av">{c.avatar}</div>
                    {c.online && <span className="cb-online" />}
                  </div>
                  <div className="cb-contact-info">
                    <div className="cb-contact-row">
                      <span className="cb-contact-name">{c.name}</span>
                      <span className="cb-contact-time">{c.time}</span>
                    </div>
                    <p className="cb-contact-last">{c.lastMsg}</p>
                  </div>
                  {c.unread > 0 && <span className="cb-unread">{c.unread}</span>}
                </div>
              ))}
              <Link to="/message" className="cb-see-all">Xem tất cả tin nhắn →</Link>
            </div>
          )}

          {/* Messages */}
          {activeId && (
            <>
              <div className="cb-messages">
                {msgs.map(msg => (
                  <div key={msg.id} className={`cb-msg-row ${msg.from}`}>
                    {msg.type === 'text' ? (
                      <div className={`cb-bubble ${msg.from}`}>{msg.text}</div>
                    ) : (
                      <div className="cb-bubble-img">
                        <img src={msg.image} alt="img" />
                      </div>
                    )}
                    <span className="cb-msg-time">{msg.time}</span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="cb-input-bar">
                <button className="cb-img-btn" onClick={() => fileRef.current.click()}>📷</button>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={sendImage} />
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  className="cb-input"
                />
                <button className="cb-send" onClick={sendMessage} disabled={!input.trim()}>➤</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bubble button */}
      <button className="cb-btn" onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
        {!open && totalUnread > 0 && <span className="cb-badge">{totalUnread}</span>}
      </button>
    </div>
  );
}
