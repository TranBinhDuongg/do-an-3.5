import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardApi, readAllNotificationsApi } from '../../api/employer';
import './Home.css';

const STATUS_LABEL = {
  approved: { text: 'Đã duyệt',  cls: 'approved' },
  pending:  { text: 'Chờ duyệt', cls: 'pending'  },
  rejected: { text: 'Từ chối',   cls: 'rejected' },
  paused:   { text: 'Tạm dừng',  cls: 'paused'   },
};

export default function EmployerHome({ user, onLogout }) {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [notiOpen, setNotiOpen]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [data, setData]           = useState(null);
  const [error, setError]         = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardApi()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleReadAll = async () => {
    try {
      await readAllNotificationsApi();
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, unread: false })),
      }));
    } catch {}
  };

  const stats = data ? [
    { icon: '🏠', label: 'Tin đang đăng',   value: data.stats.tin_dang,      color: 'blue',   sub: `${data.stats.tong_tin} tổng cộng` },
    { icon: '👁️', label: 'Tổng lượt xem',   value: data.stats.tong_luot_xem, color: 'green',  sub: 'Tất cả tin đăng' },
    { icon: '📞', label: 'Tổng liên hệ',    value: data.stats.tong_lien_he,  color: 'orange', sub: 'Tất cả tin đăng' },
    { icon: '❤️', label: 'Lượt lưu tin',    value: data.stats.tong_luu_tin,  color: 'red',    sub: 'Tổng cộng' },
  ] : [];

  const unreadCount = data?.notifications?.filter(n => n.unread).length || 0;
  const goi = data?.goi;

  return (
    <div className="emp-page">
      {/* NAVBAR */}
      <nav className="emp-nav">
        <div className="emp-nav-inner">
          <Link to="/" className="emp-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="emp-nav-links">
            <Link to="/employer"         className="emp-nav-link active">Tổng quan</Link>
            <Link to="/employer/rooms"   className="emp-nav-link">Tin đăng</Link>
            <Link to="/employer/pricing" className="emp-nav-link emp-nav-link-pricing">💎 Mua gói</Link>
          </div>
          <div className="emp-nav-right">
            <div className="emp-noti-wrap">
              <button className="emp-noti-btn" onClick={() => { setNotiOpen(!notiOpen); setMenuOpen(false); }}>
                🔔
                {unreadCount > 0 && <span className="emp-noti-dot">{unreadCount}</span>}
              </button>
              {notiOpen && (
                <div className="emp-noti-dropdown">
                  <div className="emp-noti-header">
                    <strong>Thông báo</strong>
                    {unreadCount > 0 && <button onClick={handleReadAll}>Đánh dấu đã đọc</button>}
                  </div>
                  {data?.notifications?.length ? data.notifications.map(n => (
                    <div key={n.id} className={`emp-noti-item ${n.unread ? 'unread' : ''}`}>
                      <span className="emp-noti-icon">{n.icon}</span>
                      <div><p>{n.text}</p><span>{n.time}</span></div>
                    </div>
                  )) : <p className="emp-noti-empty">Không có thông báo</p>}
                </div>
              )}
            </div>
            <div className="emp-user-wrap">
              <button className="emp-user-btn" onClick={() => { setMenuOpen(!menuOpen); setNotiOpen(false); }}>
                <div className="emp-avatar">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : (user?.name?.charAt(0) || 'C')}
                </div>
                <div className="emp-user-info">
                  <span className="emp-user-name">{user?.name || 'Chủ trọ'}</span>
                  <span className="emp-user-role">Chủ trọ</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="emp-user-dropdown">
                  <Link to="/profile" className="emp-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                  <hr className="emp-drop-hr" />
                  <Link to="/" className="emp-drop-item" onClick={() => setMenuOpen(false)}>🔍 Xem trang người thuê</Link>
                  <hr className="emp-drop-hr" />
                  <button className="emp-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); navigate('/login'); }}>🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="emp-body">
        {/* PAGE HEADER */}
        <div className="emp-page-header">
          <div>
            <h1>Xin chào, {user?.name || 'Chủ trọ'}! 👋</h1>
            <p>Quản lý tin đăng và theo dõi hiệu quả cho thuê của bạn</p>
          </div>
          <Link to="/employer/post" className="emp-post-btn">+ Đăng tin mới</Link>
        </div>

        {error && <div className="emp-error">⚠️ {error}</div>}

        {loading ? (
          <div className="emp-loading">
            <div className="emp-spinner" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="emp-stats-grid">
              {stats.map(s => (
                <div key={s.label} className={`emp-stat-card emp-stat-${s.color}`}>
                  <div className="emp-stat-top">
                    <span className="emp-stat-icon">{s.icon}</span>
                    <strong className="emp-stat-value">{s.value.toLocaleString('vi-VN')}</strong>
                  </div>
                  <p className="emp-stat-label">{s.label}</p>
                  <span className="emp-stat-sub">{s.sub}</span>
                </div>
              ))}
            </div>

            {/* STATUS SUMMARY */}
            {data && (
              <div className="emp-status-bar">
                <div className="emp-status-item">
                  <span className="emp-status-dot approved" />
                  <span>Đã duyệt: <strong>{data.stats.tin_dang}</strong></span>
                </div>
                <div className="emp-status-item">
                  <span className="emp-status-dot pending" />
                  <span>Chờ duyệt: <strong>{data.stats.cho_duyet}</strong></span>
                </div>
                <div className="emp-status-item">
                  <span className="emp-status-dot rejected" />
                  <span>Từ chối: <strong>{data.stats.bi_tu_choi}</strong></span>
                </div>
                <div className="emp-status-item">
                  <span className="emp-status-dot paused" />
                  <span>Tạm dừng: <strong>{data.stats.tam_dung}</strong></span>
                </div>
              </div>
            )}

            <div className="emp-main-grid">
              {/* LEFT: Room list */}
              <div className="emp-rooms-section">
                <div className="emp-section-header">
                  <h2>Tin đăng gần đây</h2>
                  <Link to="/employer/rooms" className="emp-see-all">Xem tất cả →</Link>
                </div>

                {data?.rooms?.length === 0 ? (
                  <div className="emp-empty">
                    <p>🏠 Bạn chưa có tin đăng nào.</p>
                    <Link to="/employer/post" className="emp-post-btn">Đăng tin ngay</Link>
                  </div>
                ) : (
                  <div className="emp-room-list">
                    {data?.rooms?.map(room => (
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
                          <p className="emp-room-addr">📍 {room.address}</p>
                          <div className="emp-room-meta">
                            <span className="emp-room-price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
                            <span className="emp-room-area">📐 {room.area} m²</span>
                            <span className="emp-room-type">{room.type}</span>
                          </div>
                          <div className="emp-room-stats">
                            <span>👁️ {room.views}</span>
                            <span>📞 {room.contacts}</span>
                            <span>❤️ {room.saved}</span>
                            <span>🕐 {room.postedAt}</span>
                          </div>
                        </div>
                        <div className="emp-room-actions">
                          <Link to="/employer/rooms" className="emp-btn-view">✏️ Quản lý</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Sidebar */}
              <div className="emp-sidebar">
                {/* Gói đăng tin */}
                <div className={`emp-widget emp-goi-widget ${!goi ? 'no-goi' : ''}`}>
                  <h3 className="emp-widget-title">💎 Gói đăng tin</h3>
                  {goi ? (
                    <div className="emp-goi-info">
                      <p className="emp-goi-name">{goi.tenGoi}</p>
                      <div className="emp-goi-meta">
                        <span>Còn <strong>{goi.ngayConLai}</strong> ngày</span>
                        <span>Giới hạn: <strong>{goi.gioi_han_tin} tin</strong></span>
                      </div>
                      <div className="emp-goi-bar-wrap">
                        <div
                          className="emp-goi-bar"
                          style={{ width: `${Math.max(0, Math.min(100, (goi.ngayConLai / 30) * 100))}%` }}
                        />
                      </div>
                      <Link to="/employer/pricing" className="emp-goi-upgrade">Nâng cấp gói →</Link>
                    </div>
                  ) : (
                    <div className="emp-goi-empty">
                      <p>Bạn chưa có gói đăng tin nào.</p>
                      <Link to="/employer/pricing" className="emp-post-btn" style={{ marginTop: 8, display: 'inline-block' }}>Mua gói ngay</Link>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="emp-widget">
                  <h3 className="emp-widget-title">⚡ Thao tác nhanh</h3>
                  <div className="emp-quick-actions">
                    <Link to="/employer/post"    className="emp-quick-btn blue">  <span>📝</span> Đăng tin mới</Link>
                    <Link to="/employer/rooms"   className="emp-quick-btn green"> <span>📋</span> Quản lý tin</Link>
                    <Link to="/profile"          className="emp-quick-btn purple"><span>👤</span> Hồ sơ chủ trọ</Link>
                    <Link to="/"                 className="emp-quick-btn gray">  <span>🔍</span> Xem trang thuê</Link>
                  </div>
                </div>

                {/* Notifications */}
                <div className="emp-widget">
                  <div className="emp-widget-header">
                    <h3 className="emp-widget-title">🔔 Thông báo gần đây</h3>
                    {unreadCount > 0 && <span className="emp-unread-badge">{unreadCount} mới</span>}
                  </div>
                  <div className="emp-noti-list">
                    {data?.notifications?.length ? data.notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`emp-noti-row ${n.unread ? 'unread' : ''}`}>
                        <span className="emp-noti-row-icon">{n.icon}</span>
                        <div className="emp-noti-row-body">
                          <p>{n.text}</p>
                          <span>{n.time}</span>
                        </div>
                      </div>
                    )) : <p className="emp-noti-empty">Không có thông báo mới</p>}
                  </div>
                </div>

                {/* Tips */}
                <div className="emp-widget emp-tips">
                  <h3 className="emp-widget-title">💡 Mẹo tăng hiệu quả</h3>
                  <ul className="emp-tips-list">
                    <li>Thêm nhiều ảnh chất lượng cao để tăng lượt xem</li>
                    <li>Cập nhật giá thuê theo thị trường</li>
                    <li>Phản hồi liên hệ nhanh để tăng tỷ lệ cho thuê</li>
                    <li>Mô tả chi tiết tiện ích xung quanh</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
