import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const allRooms = [
  { id: 1, title: 'Phòng trọ cao cấp gần ĐH Bách Khoa', address: '15 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội', price: 3500000, area: 25, type: 'Phòng trọ', available: true, views: 142, contacts: 8, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', postedAt: '2 ngày trước' },
  { id: 2, title: 'Chung cư mini full nội thất, ban công view đẹp', address: '88 Láng Hạ, Đống Đa, Hà Nội', price: 5500000, area: 35, type: 'Chung cư mini', available: true, views: 89, contacts: 3, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', postedAt: '5 ngày trước' },
  { id: 3, title: 'Phòng trọ giá rẻ, gần KCN Thăng Long', address: '5 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội', price: 1800000, area: 18, type: 'Phòng trọ', available: false, views: 56, contacts: 0, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', postedAt: '10 ngày trước' },
  { id: 4, title: 'Nhà nguyên căn 3 phòng ngủ, sân vườn rộng', address: '22 Nguyễn Trãi, Thanh Xuân, Hà Nội', price: 12000000, area: 80, type: 'Nhà nguyên căn', available: true, views: 210, contacts: 15, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', postedAt: '1 ngày trước' },
];

export default function Rooms({ user, onLogout }) {
  const [tab, setTab] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = tab === 'all' ? allRooms
    : tab === 'available' ? allRooms.filter(r => r.available)
    : allRooms.filter(r => !r.available);

  return (
    <div className="emp-page">
      <nav className="emp-nav">
        <div className="emp-nav-inner">
          <Link to="/" className="emp-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="emp-nav-links">
            <Link to="/employer"       className="emp-nav-link">Tổng quan</Link>
            <Link to="/employer/rooms" className="emp-nav-link active">Tin đăng</Link>
            <Link to="/employer/post"  className="emp-nav-link">Đăng tin mới</Link>
          </div>
          <div className="emp-nav-right">
            <div className="emp-user-wrap">
              <button className="emp-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="emp-avatar">{user?.name?.charAt(0) || 'C'}</div>
                <div className="emp-user-info">
                  <span className="emp-user-name">{user?.name || 'Chủ trọ'}</span>
                  <span className="emp-user-role">Chủ trọ</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="emp-user-dropdown">
                  <Link to="/employer" className="emp-drop-item" onClick={() => setMenuOpen(false)}>🏠 Tổng quan</Link>
                  <hr className="emp-drop-hr" />
                  <button className="emp-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); }}>🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="emp-body">
        <div className="emp-page-header">
          <div>
            <h1>📋 Quản lý tin đăng</h1>
            <p>Theo dõi và quản lý tất cả tin đăng của bạn</p>
          </div>
          <Link to="/employer/post" className="emp-post-btn">+ Đăng tin mới</Link>
        </div>

        <div className="emp-rooms-section">
          <div className="emp-tabs">
            {[
              { key: 'all',         label: `Tất cả (${allRooms.length})` },
              { key: 'available',   label: `Còn phòng (${allRooms.filter(r => r.available).length})` },
              { key: 'unavailable', label: `Hết phòng (${allRooms.filter(r => !r.available).length})` },
            ].map(t => (
              <button key={t.key} className={`emp-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}>{t.label}</button>
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
      </div>
    </div>
  );
}
