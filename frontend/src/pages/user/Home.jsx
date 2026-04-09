import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Home.css';

const mockRooms = [
  { id: 1, title: 'Phòng trọ cao cấp gần ĐH Bách Khoa', address: '15 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội', price: 3500000, area: 25, type: 'Phòng trọ', available: true, isNew: true, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', postedAt: '2 giờ trước' },
  { id: 2, title: 'Chung cư mini full nội thất, ban công view đẹp', address: '88 Láng Hạ, Đống Đa, Hà Nội', price: 5500000, area: 35, type: 'Chung cư mini', available: true, isNew: false, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', postedAt: '5 giờ trước' },
  { id: 3, title: 'Nhà nguyên căn 3 phòng ngủ, sân vườn rộng', address: '22 Nguyễn Trãi, Thanh Xuân, Hà Nội', price: 12000000, area: 80, type: 'Nhà nguyên căn', available: true, isNew: true, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', postedAt: '1 ngày trước' },
  { id: 4, title: 'Phòng trọ giá rẻ, gần KCN Thăng Long', address: '5 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội', price: 1800000, area: 18, type: 'Phòng trọ', available: false, isNew: false, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', postedAt: '2 ngày trước' },
  { id: 5, title: 'Studio cao cấp trung tâm quận 1, TP.HCM', address: '120 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', price: 8000000, area: 30, type: 'Studio', available: true, isNew: true, image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=250&fit=crop', postedAt: '3 giờ trước' },
  { id: 6, title: 'Phòng trọ sạch sẽ, yên tĩnh, gần ĐH Kinh Tế', address: '45 Đinh Tiên Hoàng, Bình Thạnh, TP. Hồ Chí Minh', price: 2800000, area: 22, type: 'Phòng trọ', available: true, isNew: false, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop', postedAt: '4 ngày trước' },
];

const categories = [
  { icon: '🛏️', label: 'Phòng trọ', count: '4,200+', color: '#eff6ff', border: '#bfdbfe' },
  { icon: '🏢', label: 'Chung cư mini', count: '1,800+', color: '#f0fdf4', border: '#bbf7d0' },
  { icon: '🏡', label: 'Nhà nguyên căn', count: '900+', color: '#fff7ed', border: '#fed7aa' },
  { icon: '🏨', label: 'Studio', count: '1,200+', color: '#fdf4ff', border: '#e9d5ff' },
  { icon: '🎓', label: 'Ký túc xá', count: '300+', color: '#fefce8', border: '#fde68a' },
  { icon: '🏠', label: 'Căn hộ dịch vụ', count: '600+', color: '#fff1f2', border: '#fecdd3' },
];

export default function Home({ user, onLogout }) {
  const [search, setSearch] = useState({ keyword: '', city: '', type: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    // navigate to search page later
  };

  return (
    <div className="home-wrap">
      {/* NAVBAR */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <Link to="/" className="home-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="home-nav-links">
            <Link to="/" className="home-nav-link active">Trang chủ</Link>
            <Link to="/search" className="home-nav-link">Tìm phòng</Link>
            <Link to="/favorites" className="home-nav-link">Yêu thích</Link>
          </div>
          <div className="home-nav-auth">
            {user ? (
              <div className="home-nav-user">
                <button className="home-nav-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="home-nav-avatar">{user.name?.charAt(0)}</div>
                  <span>{user.name}</span>
                  <span>▾</span>
                </button>
                {menuOpen && (
                  <div className="home-nav-dropdown">
                    <Link to="/profile" className="home-nav-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                    <Link to="/favorites" className="home-nav-drop-item" onClick={() => setMenuOpen(false)}>❤️ Yêu thích</Link>
                    <hr className="home-nav-drop-hr" />
                    <button className="home-nav-drop-logout" onClick={() => { onLogout(); setMenuOpen(false); }}>🚪 Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="home-nav-btn-outline">Đăng nhập</Link>
                <Link to="/register" className="home-nav-btn-primary">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-content">
          <h1 className="home-hero-title">Tìm phòng trọ ưng ý<br />chỉ trong vài giây</h1>
          <p className="home-hero-sub">Hàng nghìn phòng trọ chất lượng, giá tốt trên toàn quốc</p>

          <form className="home-search-box" onSubmit={e => { e.preventDefault(); navigate(`/search?keyword=${search.keyword}&city=${search.city}&type=${search.type}`); }}>
            <div className="home-search-input">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Tìm theo tên, địa chỉ..."
                value={search.keyword}
                onChange={e => setSearch({ ...search, keyword: e.target.value })}
              />
            </div>
            <select value={search.city} onChange={e => setSearch({ ...search, city: e.target.value })}>
              <option value="">📍 Tất cả tỉnh/thành</option>
              {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={search.type} onChange={e => setSearch({ ...search, type: e.target.value })}>
              <option value="">🏠 Loại phòng</option>
              {['Phòng trọ', 'Chung cư mini', 'Nhà nguyên căn', 'Studio', 'Ký túc xá'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button type="submit">Tìm kiếm</button>
          </form>

          <div className="home-quick-tags">
            {['Hà Nội', 'TP. HCM', 'Đà Nẵng', 'Phòng trọ', 'Chung cư mini'].map(tag => (
              <button key={tag} onClick={() => navigate(`/search?keyword=${tag}`)}>{tag}</button>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats-bar">
        <div className="home-container">
          {[
            { icon: '🏠', num: '10,000+', label: 'Phòng trọ' },
            { icon: '👥', num: '5,000+', label: 'Chủ trọ' },
            { icon: '🔍', num: '50,000+', label: 'Người thuê' },
            { icon: '🌆', num: '63', label: 'Tỉnh thành' },
          ].map(s => (
            <div key={s.label} className="home-stat-item">
              <span>{s.icon}</span>
              <strong>{s.num}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-head">
            <h2>Danh mục phòng</h2>
            <a href="#">Xem tất cả →</a>
          </div>
          <div className="home-cat-grid">
            {categories.map(cat => (
              <div key={cat.label} className="home-cat-card" style={{ background: cat.color, borderColor: cat.border }}>
                <span className="home-cat-icon">{cat.icon}</span>
                <strong>{cat.label}</strong>
                <span>{cat.count} tin</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ROOMS */}
      <section className="home-section home-section-gray">
        <div className="home-container">
          <div className="home-section-head">
            <h2>🆕 Tin mới nhất</h2>
            <a href="#">Xem tất cả →</a>
          </div>
          <div className="home-room-grid">
            {mockRooms.filter(r => r.isNew).map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-head">
            <h2>⭐ Phòng nổi bật</h2>
            <a href="#">Xem tất cả →</a>
          </div>
          <div className="home-room-grid">
            {mockRooms.map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="home-container">
          <h2>Bạn có phòng muốn cho thuê?</h2>
          <p>Đăng tin miễn phí, tiếp cận hàng nghìn người thuê mỗi ngày</p>
          <Link to="/post-room" className="home-cta-btn">Đăng tin ngay →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-grid">
            <div>
              <div className="home-footer-logo">🏠 PhòngTrọ<span>VN</span></div>
              <p>Nền tảng tìm và đăng phòng trọ uy tín, nhanh chóng nhất Việt Nam.</p>
            </div>
            <div>
              <h4>Người thuê</h4>
              <ul>
                <li><a href="#">Tìm phòng trọ</a></li>
                <li><a href="#">Chung cư mini</a></li>
                <li><a href="#">Nhà nguyên căn</a></li>
              </ul>
            </div>
            <div>
              <h4>Chủ trọ</h4>
              <ul>
                <li><a href="#">Đăng tin cho thuê</a></li>
                <li><a href="#">Quản lý tin đăng</a></li>
              </ul>
            </div>
            <div>
              <h4>Hỗ trợ</h4>
              <ul>
                <li><a href="#">Trung tâm hỗ trợ</a></li>
                <li><a href="#">Điều khoản sử dụng</a></li>
                <li><a href="#">Liên hệ: 1900 xxxx</a></li>
              </ul>
            </div>
          </div>
          <div className="home-footer-bottom">© 2025 PhòngTrọVN. Tất cả quyền được bảo lưu.</div>
        </div>
      </footer>
    </div>
  );
}

function RoomCard({ room }) {
  return (
    <div className="room-card">
      <div className="room-card-img-wrap">
        <img src={room.image} alt={room.title} />
        <span className={`room-card-badge ${room.available ? 'green' : 'red'}`}>
          {room.available ? 'Còn phòng' : 'Hết phòng'}
        </span>
        {room.isNew && <span className="room-card-new">Mới</span>}
      </div>
      <div className="room-card-body">
        <h3 className="room-card-title">{room.title}</h3>
        <p className="room-card-addr">📍 {room.address}</p>
        <div className="room-card-meta">
          <span className="room-card-area">📐 {room.area} m²</span>
          <span className="room-card-type">{room.type}</span>
        </div>
        <div className="room-card-footer">
          <span className="room-card-price">{room.price.toLocaleString('vi-VN')}đ/tháng</span>
          <span className="room-card-time">{room.postedAt}</span>
        </div>
      </div>
    </div>
  );
}
