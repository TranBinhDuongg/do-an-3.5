import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRoomsEmployerApi, updateRoomStatusApi, deleteRoomApi, getNotificationsApi, readAllNotificationsApi, pushRoomApi } from '../../api/employer';
import EmployerNavbar from '../../components/EmployerNavbar';
import './Home.css';
import './Rooms.css';

const STATUS_LABEL = {
  approved: { text: 'Đã duyệt',  cls: 'approved' },
  pending:  { text: 'Chờ duyệt', cls: 'pending'  },
  rejected: { text: 'Từ chối',   cls: 'rejected' },
  paused:   { text: 'Tạm dừng',  cls: 'paused'   },
};

const TABS = [
  { key: 'all',      label: 'Tất cả',    status: undefined },
  { key: 'approved', label: 'Đã duyệt',  status: 'approved' },
  { key: 'pending',  label: 'Chờ duyệt', status: 'pending'  },
  { key: 'paused',   label: 'Tạm dừng',  status: 'paused'   },
  { key: 'rejected', label: 'Từ chối',   status: 'rejected' },
];

export default function Rooms({ user, onLogout }) {
  const [tab, setTab]         = useState('all');
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [notifications, setNotifications] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // roomId to delete
  const navigate = useNavigate();

  useEffect(() => {
    getNotificationsApi()
      .then(d => setNotifications(d.notifications))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleReadAll = async () => {
    try {
      await readAllNotificationsApi();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch {}
  };

  const fetchRooms = async (status) => {
    setLoading(true);
    setError('');
    try {
      const data = await getRoomsEmployerApi(status);
      setRooms(data.rooms);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = TABS.find(t => t.key === tab);
    fetchRooms(t?.status);
  }, [tab]);

  const handleToggleStatus = async (room) => {
    const newStatus = room.status === 'paused' ? 'approved' : 'paused';
    try {
      await updateRoomStatusApi(room.id, newStatus);
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: newStatus } : r));
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleDelete = async (roomId) => {
    try {
      await deleteRoomApi(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setConfirmDelete(null);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handlePush = async (roomId) => {
    try {
      const res = await pushRoomApi(roomId);
      alert(res.message);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  // Count by status from full list (only accurate on 'all' tab)
  const counts = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="emp-page">
      {/* NAVBAR */}
      <EmployerNavbar user={user} onLogout={onLogout} />

      <div className="emp-body">
        <div className="emp-page-header">
          <div>
            <h1>📋 Quản lý tin đăng</h1>
            <p>Theo dõi và quản lý tất cả tin đăng của bạn</p>
          </div>
          <Link to="/employer/post" className="emp-post-btn">+ Đăng tin mới</Link>
        </div>

        {error && <div className="emp-error">⚠️ {error}</div>}

        <div className="emp-rooms-section">
          {/* TABS */}
          <div className="emp-tabs">
            {TABS.map(t => (
              <button key={t.key}
                className={`emp-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}>
                {t.label}
                {tab === 'all' && t.key !== 'all' && counts[t.status] > 0 && (
                  <span className={`rooms-tab-badge ${t.key}`}>{counts[t.status]}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="emp-loading">
              <div className="emp-spinner" />
              <p>Đang tải...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="rooms-empty">
              <p>🏠 Không có tin đăng nào.</p>
              <Link to="/employer/post" className="emp-post-btn">Đăng tin ngay</Link>
            </div>
          ) : (
            <div className="emp-room-list">
              {rooms.map(room => (
                <div key={room.id} className="emp-room-card">
                  <img
                    src={room.image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop'}
                    alt={room.title}
                    className="emp-room-img"
                  />
                  <div className="emp-room-info">
                    <div className="emp-room-top">
                      <h3 className="emp-room-title">{room.title}</h3>
                      <span className={`emp-room-status ${STATUS_LABEL[room.status]?.cls}`}>
                        ● {STATUS_LABEL[room.status]?.text}
                      </span>
                    </div>
                    <p className="emp-room-addr">📍 {room.address}, {room.city}</p>
                    <div className="emp-room-meta">
                      <span className="emp-room-price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
                      <span className="emp-room-area">📐 {room.area} m²</span>
                      <span className="emp-room-type">{room.type}</span>
                    </div>
                    <div className="emp-room-stats">
                      <span>👁️ {room.views} lượt xem</span>
                      <span>📞 {room.contacts} liên hệ</span>
                      <span>❤️ {room.saved} lưu</span>
                      <span>🕐 {room.postedAt}</span>
                    </div>
                  </div>

                  <div className="emp-room-actions">
                    <Link to={`/employer/rooms/${room.id}`} className="emp-btn-view">🔍 Chi tiết</Link>
                    <Link to={`/employer/rooms/${room.id}/edit`} className="emp-btn-edit">✏️ Sửa</Link>
                    {/* Chỉ cho pause/activate nếu đã duyệt hoặc đang tạm dừng */}
                    {(room.status === 'approved' || room.status === 'paused') && (
                      <button
                        className={`emp-btn-toggle ${room.status === 'paused' ? 'inactive' : ''}`}
                        onClick={() => handleToggleStatus(room)}>
                        {room.status === 'paused' ? '▶ Kích hoạt' : '⏸ Tạm dừng'}
                      </button>
                    )}
                    {room.status === 'approved' && (
                      <button
                        className="emp-btn-push"
                        style={{ backgroundColor: '#eab308', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', marginLeft: '5px' }}
                        onClick={() => handlePush(room.id)}>
                        🚀 Đẩy lên
                      </button>
                    )}
                    <button
                      className="emp-btn-delete"
                      onClick={() => setConfirmDelete(room.id)}
                      title="Xóa tin">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="rooms-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="rooms-modal" onClick={e => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa tin đăng này? Hành động này không thể hoàn tác.</p>
            <div className="rooms-modal-actions">
              <button className="rooms-modal-cancel" onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button className="rooms-modal-confirm" onClick={() => handleDelete(confirmDelete)}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
