import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getHomeDataApi } from '../../api/rooms';
import './Home.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';

const categories = [
  { icon: '🛏️', label: 'Phòng trọ',      color: '#eff6ff', border: '#bfdbfe' },
  { icon: '🏢', label: 'Chung cư mini',   color: '#f0fdf4', border: '#bbf7d0' },
  { icon: '🏡', label: 'Nhà nguyên căn',  color: '#fff7ed', border: '#fed7aa' },
  { icon: '🏨', label: 'Studio',          color: '#fdf4ff', border: '#e9d5ff' },
  { icon: '🎓', label: 'Ký túc xá',       color: '#fefce8', border: '#fde68a' },
  { icon: '🏠', label: 'Căn hộ dịch vụ', color: '#fff1f2', border: '#fecdd3' },
];

export default function Home({ user, onLogout }) {
  const [search, setSearch] = useState({ keyword: '', city: '', type: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [newRooms, setNewRooms] = useState([]);
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [stats, setStats] = useState({ total_rooms: 0, total_employers: 0, total_users: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    getHomeDataApi()
      .then(d => {
        setNewRooms(d.newRooms);
        setFeaturedRooms(d.featuredRooms);
        setStats(d.stats);
      })
      .catch(console.error);
  }, []);

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
            <Link to="/message" className="home-nav-link">Tin nhắn</Link>
          </div>
          <div className="home-nav-auth">
            {user ? (
              <div className="home-nav-user">
                <button className="home-nav-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="home-nav-avatar">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="avatar" />
                      : user.name?.charAt(0)}
                  </div>
                  <div className="home-nav-user-info">
                    <span className="home-nav-user-name">{user.name}</span>
                    <span className="home-nav-user-role">Người thuê</span>
                  </div>
                  <span>▾</span>
                </button>
                {menuOpen && (
                  <div className="home-nav-dropdown">
                    <Link to="/profile" className="home-nav-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                    <Link to="/favorites" className="home-nav-drop-item" onClick={() => setMenuOpen(false)}>❤️ Yêu thích</Link>
                    <hr className="home-nav-drop-hr" />
                    <button className="home-nav-drop-logout" onClick={() => { onLogout(); setMenuOpen(false); navigate('/login'); }}>🚪 Đăng xuất</button>
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
            { icon: '🏠', num: stats.total_rooms?.toLocaleString('vi-VN') + '+', label: 'Phòng trọ' },
            { icon: '👥', num: stats.total_employers?.toLocaleString('vi-VN') + '+', label: 'Chủ trọ' },
            { icon: '🔍', num: stats.total_users?.toLocaleString('vi-VN') + '+', label: 'Người thuê' },
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
              <div key={cat.label} className="home-cat-card"
                style={{ background: cat.color, borderColor: cat.border }}
                onClick={() => navigate(`/search?type=${encodeURIComponent(cat.label)}`)}>
                <span className="home-cat-icon">{cat.icon}</span>
                <strong>{cat.label}</strong>
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
            <Link to="/search" style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Xem tất cả →</Link>
          </div>
          <div className="home-room-grid">
            {newRooms.length > 0
              ? newRooms.map(room => <RoomCard key={room.id} room={room} />)
              : <p style={{ color: '#94a3b8' }}>Chưa có tin đăng nào.</p>}
          </div>
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-head">
            <h2>⭐ Phòng nổi bật</h2>
            <Link to="/search" style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Xem tất cả →</Link>
          </div>
          <div className="home-room-grid">
            {featuredRooms.length > 0
              ? featuredRooms.map(room => <RoomCard key={room.id} room={room} />)
              : <p style={{ color: '#94a3b8' }}>Chưa có tin đăng nào.</p>}
          </div>
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
    <Link to={`/room/${room.id}`} className="room-card" style={{ textDecoration: 'none' }}>
      <div className="room-card-img-wrap">
        <img src={room.image || FALLBACK_IMG} alt={room.title} />
        <span className={`room-card-badge ${room.available ? 'green' : 'red'}`}>
          {room.available ? 'Còn phòng' : 'Hết phòng'}
        </span>
      </div>
      <div className="room-card-body">
        <h3 className="room-card-title">{room.title}</h3>
        <p className="room-card-addr">📍 {room.address}</p>
        <div className="room-card-meta">
          <span className="room-card-area">📐 {room.area} m²</span>
          <span className="room-card-type">{room.type}</span>
        </div>
        <div className="room-card-footer">
          <span className="room-card-price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
          <span className="room-card-time">{room.postedAt}</span>
        </div>
      </div>
    </Link>
  );
}
