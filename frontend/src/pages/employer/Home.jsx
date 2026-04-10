import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const myRooms = [
  { id: 1, title: 'Phòng trọ cao cấp gần ĐH Bách Khoa', address: '15 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội', price: 3500000, area: 25, type: 'Phòng trọ', available: true, views: 142, contacts: 8, saved: 12, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', postedAt: '2 ngày trước' },
  { id: 2, title: 'Chung cư mini full nội thất, ban công view đẹp', address: '88 Láng Hạ, Đống Đa, Hà Nội', price: 5500000, area: 35, type: 'Chung cư mini', available: true, views: 89, contacts: 3, saved: 7, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', postedAt: '5 ngày trước' },
  { id: 3, title: 'Phòng trọ giá rẻ, gần KCN Thăng Long', address: '5 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội', price: 1800000, area: 18, type: 'Phòng trọ', available: false, views: 56, contacts: 0, saved: 3, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', postedAt: '10 ngày trước' },
  { id: 4, title: 'Nhà nguyên căn 3 phòng ngủ, sân vườn rộng', address: '22 Nguyễn Trãi, Thanh Xuân, Hà Nội', price: 12000000, area: 80, type: 'Nhà nguyên căn', available: true, views: 210, contacts: 15, saved: 20, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', postedAt: '1 ngày trước' },
];

const notifications = [
  { id: 1, icon: '📞', text: 'Nguyễn Văn A vừa xem số điện thoại của bạn', time: '5 phút trước', unread: true },
  { id: 2, icon: '❤️', text: 'Có người lưu tin "Phòng trọ cao cấp gần ĐH Bách Khoa"', time: '1 giờ trước', unread: true },
  { id: 3, icon: '👁️', text: 'Tin đăng của bạn đạt 200 lượt xem', time: '3 giờ trước', unread: false },
  { id: 4, icon: '✅', text: 'Tin đăng "Nhà nguyên căn 3 phòng ngủ" đã được duyệt', time: '1 ngày trước', unread: false },
];

export default function EmployerHome({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const stats = [
    { icon: '🏠', label: 'Tin đang đăng', value: 3, color: 'blue', sub: '+1 tuần này' },
    { icon: '👁️', label: 'Lượt xem hôm nay', value: 128, color: 'green', sub: '+24 so với hôm qua' },
    { icon: '📞', label: 'Liên hệ mới', value: 7, color: 'orange', sub: 'Trong 7 ngày qua' },
    { icon: '❤️', label: 'Lượt lưu tin', value: 42, color: 'red', sub: 'Tổng cộng' },
  ];

  const filtered = activeTab === 'all' ? myRooms
    : activeTab === 'available' ? myRooms.filter(r => r.available)
    : myRooms.filter(r => !r.available);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="emp-page">
      {/* NAVBAR */}
      <nav className="emp-nav">
        <div className="emp-nav-inner">
          <Link to="/" className="emp-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>

          <div className="emp-nav-links">
            <Link to="/employer"      className="emp-nav-link active">Tổng quan</Link>
            <Link to="/employer/rooms" className="emp-nav-link">Tin đăng</Link>
            <Link to="/employer/post" className="emp-nav-link">Đăng tin mới</Link>
          </div>

          <div className="emp-nav-right">
            {/* Notification bell */}
            <div className="emp-noti-wrap">
              <button className="emp-noti-btn" onClick={() => { setNotiOpen(!notiOpen); setMenuOpen(false); }}>
                🔔
                {unreadCount > 0 && <span className="emp-noti-dot">{unreadCount}</span>}
              </button>
              {notiOpen && (
                <div className="emp-noti-dropdown">
                  <div className="emp-noti-header">
                    <strong>Thông báo</strong>
                    <button>Đánh dấu đã đọc</button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} className={`emp-noti-item ${n.unread ? 'unread' : ''}`}>
                      <span className="emp-noti-icon">{n.icon}</span>
                      <div>
                        <p>{n.text}</p>
                        <span>{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="emp-user-wrap">
              <button className="emp-user-btn" onClick={() => { setMenuOpen(!menuOpen); setNotiOpen(false); }}>
                <div className="emp-avatar">{user?.name?.charAt(0) || 'C'}</div>
                <div className="emp-user-info">
                  <span className="emp-user-name">{user?.name || 'Chủ trọ'}</span>
                  <span className="emp-user-role">Chủ trọ</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="emp-user-dropdown">
                  <Link to="/employer/profile" className="emp-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                  <Link to="/employer/settings" className="emp-drop-item" onClick={() => setMenuOpen(false)}>⚙️ Cài đặt</Link>
                  <hr className="emp-drop-hr" />
                  <Link to="/" className="emp-drop-item" onClick={() => setMenuOpen(false)}>🔍 Xem trang người thuê</Link>
                  <hr className="emp-drop-hr" />
                  <button className="emp-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); }}>🚪 Đăng xuất</button>
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

        {/* STATS */}
        <div className="emp-stats-grid">
          {stats.map(s => (
            <div key={s.label} className={`emp-stat-card emp-stat-${s.color}`}>
              <div className="emp-stat-top">
                <span className="emp-stat-icon">{s.icon}</span>
                <strong className="emp-stat-value">{s.value}</strong>
              </div>
              <p className="emp-stat-label">{s.label}</p>
              <span className="emp-stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>

        <div className="emp-main-grid">
          {/* LEFT: Room list */}
          <div className="emp-rooms-section">
            <div className="emp-section-header">
              <h2>Tin đăng của tôi</h2>
              <Link to="/employer/rooms" className="emp-see-all">Xem tất cả →</Link>
            </div>

            {/* Tabs */}
            <div className="emp-tabs">
              {[
                { key: 'all', label: `Tất cả (${myRooms.length})` },
                { key: 'available', label: `Còn phòng (${myRooms.filter(r => r.available).length})` },
                { key: 'unavailable', label: `Hết phòng (${myRooms.filter(r => !r.available).length})` },
              ].map(t => (
                <button key={t.key} className={`emp-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}>{t.label}</button>
              ))}
            </div>

            <div className="emp-room-list">
              {filtered.map(room => (
                <div key={room.id} className="emp-room-card">
                  <img src={room.image} alt={room.title} className="emp-room-img" />
                  <div className="emp-room-info">
                    <div className="emp-room-top">
                      <h3 className="emp-room-title">{room.title}</h3>
                      <span className={`emp-room-status ${room.available ? 'available' : 'unavailable'}`}>
                        {room.available ? '● Còn phòng' : '● Hết phòng'}
                      </span>
                    </div>
                    <p className="emp-room-addr">📍 {room.address}</p>
                    <div className="emp-room-meta">
                      <span className="emp-room-price">{room.price.toLocaleString('vi-VN')}đ/tháng</span>
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
                    <Link to={`/room/${room.id}`} className="emp-btn-view">👁 Xem</Link>
                    <button className="emp-btn-edit">✏️ Sửa</button>
                    <button className={`emp-btn-toggle ${room.available ? '' : 'inactive'}`}>
                      {room.available ? '⏸ Tạm dừng' : '▶ Kích hoạt'}
                    </button>
                    <button className="emp-btn-delete">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="emp-sidebar">
            {/* Quick actions */}
            <div className="emp-widget">
              <h3 className="emp-widget-title">⚡ Thao tác nhanh</h3>
              <div className="emp-quick-actions">
                <Link to="/employer/post" className="emp-quick-btn blue">
                  <span>📝</span> Đăng tin mới
                </Link>
                <Link to="/employer/rooms" className="emp-quick-btn green">
                  <span>📋</span> Quản lý tin
                </Link>
                <Link to="/employer/profile" className="emp-quick-btn purple">
                  <span>👤</span> Hồ sơ chủ trọ
                </Link>
                <Link to="/" className="emp-quick-btn gray">
                  <span>🔍</span> Xem trang thuê
                </Link>
              </div>
            </div>

            {/* Notifications */}
            <div className="emp-widget">
              <div className="emp-widget-header">
                <h3 className="emp-widget-title">🔔 Thông báo gần đây</h3>
                {unreadCount > 0 && <span className="emp-unread-badge">{unreadCount} mới</span>}
              </div>
              <div className="emp-noti-list">
                {notifications.map(n => (
                  <div key={n.id} className={`emp-noti-row ${n.unread ? 'unread' : ''}`}>
                    <span className="emp-noti-row-icon">{n.icon}</span>
                    <div className="emp-noti-row-body">
                      <p>{n.text}</p>
                      <span>{n.time}</span>
                    </div>
                  </div>
                ))}
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
      </div>
    </div>
  );
}
