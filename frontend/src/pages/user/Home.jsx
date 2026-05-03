import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getHomeDataApi } from '../../api/rooms';
import UserNavbar from '../../components/UserNavbar';
import './Home.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';

const categories = [
  { icon: '🛏️', label: 'Phòng trọ',      color: '#eff6ff', border: '#bfdbfe', count: '1.2k+' },
  { icon: '🏢', label: 'Chung cư mini',   color: '#f0fdf4', border: '#bbf7d0', count: '850+' },
  { icon: '🏡', label: 'Nhà nguyên căn',  color: '#fff7ed', border: '#fed7aa', count: '430+' },
  { icon: '🏨', label: 'Studio',          color: '#fdf4ff', border: '#e9d5ff', count: '320+' },
  { icon: '🎓', label: 'Ký túc xá',       color: '#fefce8', border: '#fde68a', count: '210+' },
  { icon: '🏠', label: 'Căn hộ dịch vụ', color: '#fff1f2', border: '#fecdd3', count: '180+' },
];

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
const TYPES  = ['Phòng trọ', 'Chung cư mini', 'Nhà nguyên căn', 'Studio', 'Ký túc xá'];

const BADGE_CONFIG = {
  'VIP Diamond': { bg: 'linear-gradient(135deg,#a855f7,#7c3aed)', icon: '💎', text: '#fff' },
  'VIP Gold':    { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: '👑', text: '#fff' },
  'VIP Silver':  { bg: 'linear-gradient(135deg,#64748b,#475569)', icon: '🥈', text: '#fff' },
  'Pro':         { bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', icon: '⚡', text: '#fff' },
  'Basic':       { bg: 'linear-gradient(135deg,#22c55e,#16a34a)', icon: '✅', text: '#fff' },
};

function getBadgeStyle(badge) {
  if (!badge) return null;
  for (const key of Object.keys(BADGE_CONFIG)) {
    if (badge.toLowerCase().includes(key.toLowerCase())) return BADGE_CONFIG[key];
  }
  return { bg: 'linear-gradient(135deg,#2563eb,#7c3aed)', icon: '⭐', text: '#fff' };
}

export default function Home({ user, onLogout }) {
  const [search, setSearch] = useState({ keyword: '', city: '', type: '' });
  const [newRooms, setNewRooms]          = useState([]);
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [topRooms, setTopRooms]           = useState([]);   // VIP Diamond/Gold/Silver
  const [trustedRooms, setTrustedRooms]   = useState([]);   // Uy tín / Pro / Basic
  const [stats, setStats] = useState({ total_rooms: 0, total_employers: 0, total_users: 0 });
  const [heroTab, setHeroTab] = useState('keyword');
  const navigate = useNavigate();

  useEffect(() => {
    getHomeDataApi()
      .then(d => {
        const vip = d.vipRooms || [];
        // Phân loại theo badge: VIP = mức cao nhất, còn lại là Uy tín
        const top     = vip.filter(r => r.badge && r.badge.toLowerCase().includes('vip'));
        const trusted = vip.filter(r => !r.badge || !r.badge.toLowerCase().includes('vip'));
        setTopRooms(top);
        setTrustedRooms(trusted);

        const allVipIds = new Set(vip.map(r => r.id));
        setNewRooms(d.newRooms || []);
        setFeaturedRooms((d.featuredRooms || []).filter(r => !allVipIds.has(r.id)));
        setStats(d.stats);
      })
      .catch(console.error);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?keyword=${search.keyword}&city=${search.city}&type=${search.type}`);
  };

  return (
    <div className="home-wrap">
      {/* NAVBAR */}
      <UserNavbar user={user} onLogout={onLogout} />

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <div className="home-hero-badge-top">
            <span role="img" aria-label="trophy">🏆</span> Nền tảng tìm phòng trọ uy tín #1 Việt Nam
          </div>
          <h1 className="home-hero-title">
            Tìm <span className="home-hero-highlight">Phòng Trọ Ưng Ý</span><br />
            Chỉ Trong Vài Giây
          </h1>
          <p className="home-hero-sub">
            Khám phá hàng nghìn không gian sống lý tưởng. Cập nhật liên tục mỗi ngày từ các chủ trọ uy tín trên toàn quốc.
          </p>

          {/* Search box */}
          <div className="home-search-wrap">
            <div className="home-search-tabs">
              <button type="button" className={`home-search-tab ${heroTab === 'keyword' ? 'active' : ''}`} onClick={() => setHeroTab('keyword')}>Tất cả</button>
              <button type="button" className={`home-search-tab ${heroTab === 'city' ? 'active' : ''}`} onClick={() => setHeroTab('city')}>Phòng trọ</button>
              <button type="button" className={`home-search-tab ${heroTab === 'type' ? 'active' : ''}`} onClick={() => setHeroTab('type')}>Căn hộ</button>
            </div>
            <form className="home-search-box" onSubmit={handleSearch}>
              <div className="home-search-input-wrap">
                <span className="home-search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input
                  type="text"
                  placeholder="Nhập tên đường, phường, quận..."
                  value={search.keyword}
                  onChange={e => setSearch({ ...search, keyword: e.target.value })}
                />
              </div>
              <div className="home-search-divider" />
              <select value={search.city} onChange={e => setSearch({ ...search, city: e.target.value })}>
                <option value="">Khu vực</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="home-search-divider" />
              <select value={search.type} onChange={e => setSearch({ ...search, type: e.target.value })}>
                <option value="">Loại phòng</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button type="submit" className="home-search-btn">
                Tìm Kiếm
              </button>
            </form>
          </div>

          <div className="home-quick-tags">
            <span className="home-quick-label">Phổ biến:</span>
            {['Hà Nội', 'TP. HCM', 'Đà Nẵng', 'Dưới 3 triệu', 'Gần Đại học'].map(tag => (
              <button type="button" key={tag} onClick={() => navigate(`/search?keyword=${tag}`)}>{tag}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════ */}
      <section className="home-stats-bar">
        <div className="home-container">
          {[
            { icon: '🏠', num: (stats.total_rooms || 0).toLocaleString('vi-VN') + '+', label: 'Tin đăng', color: '#3b82f6', bg: '#eff6ff' },
            { icon: '👥', num: (stats.total_employers || 0).toLocaleString('vi-VN') + '+', label: 'Chủ trọ', color: '#8b5cf6', bg: '#f5f3ff' },
            { icon: '🔍', num: (stats.total_users || 0).toLocaleString('vi-VN') + '+', label: 'Người thuê', color: '#0ea5e9', bg: '#f0f9ff' },
            { icon: '🌆', num: '63',  label: 'Tỉnh thành', color: '#10b981', bg: '#ecfdf5' },
          ].map(s => (
            <div key={s.label} className="home-stat-item">
              <div className="home-stat-icon-wrap" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="home-stat-content">
                <strong className="home-stat-num">{s.num}</strong>
                <span className="home-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CATEGORIES ══════════════════════════════════════════ */}
      <section className="home-section">
        <div className="home-container">
          <div className="home-section-head">
            <div>
              <h2>Danh mục phòng</h2>
              <p className="home-section-sub">Chọn loại phòng phù hợp với nhu cầu của bạn</p>
            </div>
            <Link to="/search" className="home-see-all">Xem tất cả →</Link>
          </div>
          <div className="home-cat-grid">
            {categories.map(cat => (
              <div key={cat.label} className="home-cat-card"
                style={{ background: cat.color, borderColor: cat.border }}
                onClick={() => navigate(`/search?type=${encodeURIComponent(cat.label)}`)}>
                <span className="home-cat-icon">{cat.icon}</span>
                <strong>{cat.label}</strong>
                <span className="home-cat-count">{cat.count} tin</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VIP ROOMS ════════════════════════════════════════════ */}
      {topRooms.length > 0 && (
        <section className="home-section home-section-vip">
          <div className="home-container">
            <div className="home-section-head">
              <div>
                <div className="home-vip-label">💎 TIN VIP</div>
                <h2>Phòng VIP</h2>
                <p className="home-section-sub">Chủ trọ đăng ký gói VIP – ưu tiên hiển thị cao nhất</p>
              </div>
              <Link to="/search" className="home-see-all home-see-all-vip">Xem tất cả →</Link>
            </div>
            <div className="home-vip-grid">
              {topRooms.map(room => <VipRoomCard key={room.id} room={room} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══ TRUSTED ROOMS ════════════════════════════════════════ */}
      {trustedRooms.length > 0 && (
        <section className="home-section home-section-trusted">
          <div className="home-container">
            <div className="home-section-head">
              <div>
                <div className="home-trusted-label">⭐ UY TÍN</div>
                <h2>Phòng uy tín</h2>
                <p className="home-section-sub">Chủ trọ đã xác thực, tin đăng chất lượng</p>
              </div>
              <Link to="/search" className="home-see-all home-see-all-trusted">Xem tất cả →</Link>
            </div>
            <div className="home-vip-grid">
              {trustedRooms.map(room => <VipRoomCard key={room.id} room={room} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══ NEW ROOMS ═══════════════════════════════════════════ */}
      <section className="home-section home-section-gray">
        <div className="home-container">
          <div className="home-section-head">
            <div>
              <h2>🆕 Tin mới nhất</h2>
              <p className="home-section-sub">Cập nhật liên tục mỗi ngày từ chủ trọ trên toàn quốc</p>
            </div>
            <Link to="/search" className="home-see-all">Xem tất cả →</Link>
          </div>
          <div className="home-room-grid">
            {newRooms.length > 0
              ? newRooms.map(room => <RoomCard key={room.id} room={room} isNew />)
              : <p className="home-empty-hint">Chưa có tin đăng nào.</p>}
          </div>
        </div>
      </section>

      {/* ══ FEATURED ROOMS ══════════════════════════════════════ */}
      {featuredRooms.length > 0 && (
        <section className="home-section">
          <div className="home-container">
            <div className="home-section-head">
              <div>
                <h2>🏠 Phòng nổi bật</h2>
                <p className="home-section-sub">Được đề xuất dựa trên lượt xem và đánh giá từ người dùng</p>
              </div>
              <Link to="/search" className="home-see-all">Xem tất cả →</Link>
            </div>
            <div className="home-room-grid">
              {featuredRooms.map(room => <RoomCard key={room.id} room={room} />)}
            </div>
          </div>
        </section>
      )}


      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-grid">
            <div>
              <div className="home-footer-logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                ThueNha<span>VN</span>
              </div>
              <p>Nền tảng tìm kiếm và đăng tin thuê nhà uy tín, nhanh chóng, cập nhật mới nhất tại Việt Nam.</p>
              <div className="home-footer-social">
                <a href="#" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Người thuê</h4>
              <ul>
                <li><Link to="/search">Tìm phòng trọ</Link></li>
                <li><Link to="/search?type=Chung cư mini">Chung cư mini</Link></li>
                <li><Link to="/search?type=Nhà nguyên căn">Nhà nguyên căn</Link></li>
                <li><Link to="/favorites">Tin đã lưu</Link></li>
              </ul>
            </div>
            <div>
              <h4>Chủ trọ</h4>
              <ul>
                <li><Link to="/employer/post">Đăng tin cho thuê</Link></li>
                <li><Link to="/employer/rooms">Quản lý tin đăng</Link></li>
                <li><Link to="/employer/pricing">Gói đăng tin</Link></li>
                <li><Link to="/employer/wallet">Nạp tiền</Link></li>
              </ul>
            </div>
            <div>
              <h4>Hỗ trợ</h4>
              <ul>
                <li><a href="#">Trung tâm hỗ trợ</a></li>
                <li><Link to="/terms">Điều khoản sử dụng</Link></li>
                <li><Link to="/privacy">Chính sách bảo mật</Link></li>
                <li><a href="#">Liên hệ: 1900 xxxx</a></li>
              </ul>
            </div>
          </div>
          <div className="home-footer-bottom">
            <span>© {new Date().getFullYear()} ThueNhaVN. Tất cả quyền được bảo lưu.</span>
            <div className="home-footer-bottom-links">
              <a href="#">Điều khoản</a>
              <a href="#">Bảo mật</a>
              <a href="#">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── VIP Room Card ─────────────────────────────────────── */
function VipRoomCard({ room }) {
  const badgeStyle = getBadgeStyle(room.badge);
  return (
    <Link to={`/room/${room.id}`} className="vip-card">
      <div className="vip-card-img">
        <img src={room.image || FALLBACK_IMG} alt={room.title} />
        {badgeStyle && (
          <span className="vip-card-badge" style={{ background: badgeStyle.bg, color: badgeStyle.text }}>
            {badgeStyle.icon} {room.badge}
          </span>
        )}
        <span className={`vip-card-avail ${room.available ? 'green' : 'red'}`}>
          {room.available ? 'Còn phòng' : 'Hết phòng'}
        </span>
      </div>
      <div className="vip-card-body">
        <h3 className="vip-card-title">{room.title}</h3>
        <p className="vip-card-addr">📍 {room.address}</p>
        <div className="vip-card-meta">
          <span>📐 {room.area} m²</span>
          <span className="vip-card-type">{room.type}</span>
        </div>
        <div className="vip-card-footer">
          <span className="vip-card-price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
          <span className="vip-card-time">{room.postedAt}</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Regular Room Card ─────────────────────────────────── */
function RoomCard({ room, isNew }) {
  const badgeStyle = getBadgeStyle(room.badge);
  return (
    <Link to={`/room/${room.id}`} className="room-card" style={{ textDecoration: 'none' }}>
      <div className="room-card-img-wrap">
        <img src={room.image || FALLBACK_IMG} alt={room.title} />
        <span className={`room-card-badge ${room.available ? 'green' : 'red'}`}>
          {room.available ? 'Còn phòng' : 'Hết phòng'}
        </span>
        {isNew && <span className="room-card-new">MỚI</span>}
        {badgeStyle && (
          <span className="room-card-pkg-badge" style={{ background: badgeStyle.bg }}>
            {badgeStyle.icon} {room.badge}
          </span>
        )}
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
