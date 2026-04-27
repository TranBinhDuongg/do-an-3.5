import { useState, useEffect, useRef } from 'react';
import { getNotificationsApi, readAllNotificationsApi, readOneNotificationApi } from '../api/notifications';
import './NotificationBell.css';

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Fetch khi mở hoặc khi user thay đổi
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    // Poll mỗi 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getNotificationsApi();
      setNotifications(data.notifications || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleReadAll = async () => {
    try {
      await readAllNotificationsApi();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch {}
  };

  const handleReadOne = async (id) => {
    try {
      await readOneNotificationApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="nbell-wrap" ref={ref}>
      <button className="nbell-btn" onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && <span className="nbell-dot">{unreadCount}</span>}
      </button>

      {open && (
        <div className="nbell-dropdown">
          <div className="nbell-header">
            <strong>Thông báo</strong>
            {unreadCount > 0 && (
              <button className="nbell-read-all" onClick={handleReadAll}>Đánh dấu đã đọc</button>
            )}
          </div>

          <div className="nbell-list">
            {loading && notifications.length === 0 ? (
              <div className="nbell-empty">⏳ Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="nbell-empty">
                <span>🔔</span>
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`nbell-item ${n.unread ? 'unread' : ''}`}
                  onClick={() => n.unread && handleReadOne(n.id)}
                >
                  <span className="nbell-icon">{n.icon}</span>
                  <div className="nbell-content">
                    <p>{n.text}</p>
                    <span>{n.time}</span>
                  </div>
                  {n.unread && <span className="nbell-unread-dot" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="nbell-footer">
              <button onClick={fetchNotifications} className="nbell-refresh">🔄 Làm mới</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
