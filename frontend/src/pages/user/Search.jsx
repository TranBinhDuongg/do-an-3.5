import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getRoomsApi, addFavoriteApi, removeFavoriteApi, checkFavoriteApi } from '../../api/rooms';
import UserNavbar from '../../components/UserNavbar';
import './Search.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';
const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Nhà'];
const TYPES  = ['Nhà cho thuê', 'Chung cư mini', 'Nhà nguyên căn', 'Studio', 'Ký túc xá', 'Căn hộ dịch vụ'];
const PRICES = [
  { label: 'Tất cả',       min: '',        max: '' },
  { label: 'Dưới 2 triệu', min: '',        max: '2000000' },
  { label: '2 – 4 triệu',  min: '2000000', max: '4000000' },
  { label: '4 – 6 triệu',  min: '4000000', max: '6000000' },
  { label: 'Trên 6 triệu', min: '6000000', max: '' },
];

const BADGE_CONFIG = {
  'VIP Diamond': { bg: 'linear-gradient(135deg,#a855f7,#7c3aed)', icon: '💎' },
  'VIP Gold':    { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: '👑' },
  'VIP Silver':  { bg: 'linear-gradient(135deg,#64748b,#475569)', icon: '🥈' },
  'Pro':         { bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', icon: '⚡' },
  'Basic':       { bg: 'linear-gradient(135deg,#22c55e,#16a34a)', icon: '✅' },
};
function getBadgeStyle(badge) {
  if (!badge) return null;
  for (const key of Object.keys(BADGE_CONFIG)) {
    if (badge.toLowerCase().includes(key.toLowerCase())) return { ...BADGE_CONFIG[key], label: badge };
  }
  return { bg: 'linear-gradient(135deg,#2563eb,#7c3aed)', icon: '⭐', label: badge };
}

export default function Search({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword]     = useState(searchParams.get('keyword') || '');
  const [city, setCity]           = useState(searchParams.get('city') || '');
  const [type, setType]           = useState(searchParams.get('type') || '');
  const [priceIdx, setPriceIdx]   = useState(0);
  const [minArea, setMinArea]     = useState('');
  const [sort, setSort]           = useState('newest');
  const [results, setResults]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(false);
  const [viewMode, setViewMode]   = useState('grid');
  const navigate = useNavigate();

  const priceFilter = PRICES[priceIdx];

  useEffect(() => {
    setLoading(true);
    getRoomsApi({ keyword, city, type, minPrice: priceFilter.min, maxPrice: priceFilter.max, minArea, sort, page })
      .then(d => { setResults(d.rooms); setTotal(d.total); setTotalPages(d.totalPages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [keyword, city, type, priceIdx, minArea, sort, page]);

  const clearFilters = () => {
    setKeyword(''); setCity(''); setType('');
    setPriceIdx(0); setMinArea(''); setSort('newest'); setPage(1);
  };

  const activeCount = [city, type, priceIdx > 0 ? '1' : '', minArea].filter(Boolean).length;

  return (
    <div className="search-page">
      {/* NAVBAR */}
      <UserNavbar user={user} onLogout={onLogout} />

      {/* TOP SEARCH BAR */}
      <div className="search-topbar">
        <div className="search-topbar-inner">
          <div className="search-topbar-input">
            <span>🔍</span>
            <input type="text" placeholder="Tìm theo tên, địa chỉ, khu vực..."
              value={keyword} onChange={e => setKeyword(e.target.value)} />
            {keyword && <button className="search-clear-input" onClick={() => setKeyword('')}>✕</button>}
          </div>
          <select value={city} onChange={e => setCity(e.target.value)}>
            <option value="">📍 Tất cả tỉnh/thành</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="">🏠 Loại nhà</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="search-topbar-btn">Tìm kiếm</button>
        </div>
      </div>

      <div className="search-body">
        {/* SIDEBAR */}
        <aside className="search-sidebar">
          <div className="search-filter-card">
            <div className="search-filter-header">
              <h3>🔧 Bộ lọc {activeCount > 0 && <span className="search-filter-count">{activeCount}</span>}</h3>
              {activeCount > 0 && <button className="search-filter-clear" onClick={clearFilters}>Xóa tất cả</button>}
            </div>
            <div className="search-filter-group">
              <p className="search-filter-label">Loại nhà</p>
              <div className="search-filter-tags">
                <button className={`search-filter-tag ${type === '' ? 'active' : ''}`} onClick={() => setType('')}>Tất cả</button>
                {TYPES.map(t => (
                  <button key={t} className={`search-filter-tag ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="search-filter-group">
              <p className="search-filter-label">Mức giá</p>
              {PRICES.map((p, i) => (
                <label key={p.label} className="search-filter-radio">
                  <input type="radio" name="price" checked={priceIdx === i}
                    onChange={() => { setPriceIdx(i); setPage(1); }} />
                  {p.label}
                </label>
              ))}
            </div>
            <div className="search-filter-group">
              <p className="search-filter-label">Diện tích tối thiểu</p>
              <div className="search-area-btns">
                {[{ l: 'Tất cả', v: '' }, { l: '≥ 15m²', v: '15' }, { l: '≥ 25m²', v: '25' }, { l: '≥ 40m²', v: '40' }].map(a => (
                  <button key={a.l} className={`search-area-btn ${minArea === a.v ? 'active' : ''}`}
                    onClick={() => setMinArea(a.v)}>{a.l}</button>
                ))}
              </div>
            </div>
            <div className="search-filter-group">
              <p className="search-filter-label">Tỉnh / Thành phố</p>
              {CITIES.map(c => (
                <label key={c} className="search-filter-radio">
                  <input type="radio" name="city" value={c} checked={city === c}
                    onChange={e => setCity(e.target.value)} />{c}
                </label>
              ))}
              <label className="search-filter-radio">
                <input type="radio" name="city" value="" checked={city === ''} onChange={() => setCity('')} />Tất cả
              </label>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="search-main">
          <div className="search-result-bar">
            <p className="search-result-count">
              {loading ? 'Đang tìm...' : <>Tìm thấy <strong>{total}</strong> nhà{keyword && <span> cho "<em>{keyword}</em>"</span>}</>}
            </p>
            <div className="search-result-controls">
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="search-sort-select">
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="area-desc">Diện tích lớn nhất</option>
              </select>
              <div className="search-view-btns">
                <button className={`search-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
                <button className={`search-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
              </div>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="search-active-filters">
              {city      && <span className="search-chip">📍 {city} <button onClick={() => { setCity(''); setPage(1); }}>✕</button></span>}
              {type      && <span className="search-chip">🏠 {type} <button onClick={() => { setType(''); setPage(1); }}>✕</button></span>}
              {priceIdx > 0 && <span className="search-chip">💰 {PRICES[priceIdx].label} <button onClick={() => { setPriceIdx(0); setPage(1); }}>✕</button></span>}
              {minArea   && <span className="search-chip">📐 ≥ {minArea}m² <button onClick={() => { setMinArea(''); setPage(1); }}>✕</button></span>}
            </div>
          )}

          {!loading && results.length === 0 ? (
            <div className="search-empty">
              <span>🔍</span>
              <h3>Không tìm thấy nhà phù hợp</h3>
              <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button onClick={clearFilters} className="search-empty-btn">Xóa bộ lọc</button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="search-grid">
              {results.map(room => <RoomCard key={room.id} room={room} user={user} />)}
            </div>
          ) : (
            <div className="search-list">
              {results.map(room => <RoomListItem key={room.id} room={room} user={user} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="search-pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
              <span>Trang {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function RoomCard({ room, user }) {
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const badgeStyle = getBadgeStyle(room.badge);
  useEffect(() => {
    if (!user) return;
    checkFavoriteApi(room.id).then(d => setSaved(d.saved)).catch(() => {});
  }, [room.id, user]);
  const toggleFav = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      if (saved) { await removeFavoriteApi(room.id); setSaved(false); }
      else        { await addFavoriteApi(room.id);    setSaved(true); }
    } catch {}
  };
  return (
    <Link to={`/room/${room.id}`} className={`sc-card ${room.priority <= 1 ? 'sc-card-vip' : ''}`}>
      <div className="sc-card-img">
        <img src={room.image || FALLBACK_IMG} alt={room.title} />
        <span className={`sc-badge ${room.available ? 'green' : 'red'}`}>{room.available ? 'Còn nhà' : 'Hết nhà'}</span>
        {badgeStyle && (
          <span className="sc-pkg-badge" style={{ background: badgeStyle.bg }}>
            {badgeStyle.icon} {badgeStyle.label}
          </span>
        )}
        <button className="sc-save" onClick={toggleFav}>{saved ? '❤️' : '🤍'}</button>
      </div>
      <div className="sc-body">
        <h3 className="sc-title">{room.title}</h3>
        <p className="sc-addr">📍 {room.address}</p>
        <div className="sc-meta">
          <span className="sc-area">📐 {room.area} m²</span>
          <span className="sc-type">{room.type}</span>
        </div>
        <div className="sc-footer">
          <span className="sc-price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
          <span className="sc-time">{room.postedAt}</span>
        </div>
      </div>
    </Link>
  );
}

function RoomListItem({ room, user }) {
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const badgeStyle = getBadgeStyle(room.badge);
  useEffect(() => {
    if (!user) return;
    checkFavoriteApi(room.id).then(d => setSaved(d.saved)).catch(() => {});
  }, [room.id, user]);
  const toggleFav = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      if (saved) { await removeFavoriteApi(room.id); setSaved(false); }
      else        { await addFavoriteApi(room.id);    setSaved(true); }
    } catch {}
  };
  return (
    <Link to={`/room/${room.id}`} className={`sc-list-item ${room.priority <= 1 ? 'sc-list-vip' : ''}`}>
      <div className="sc-list-img">
        <img src={room.image || FALLBACK_IMG} alt={room.title} />
        <span className={`sc-badge ${room.available ? 'green' : 'red'}`}>{room.available ? 'Còn nhà' : 'Hết nhà'}</span>
        {badgeStyle && (
          <span className="sc-pkg-badge" style={{ background: badgeStyle.bg }}>
            {badgeStyle.icon} {badgeStyle.label}
          </span>
        )}
      </div>
      <div className="sc-list-body">
        <div className="sc-list-top">
          <h3 className="sc-title">{room.title}</h3>
          <button className="sc-save" onClick={toggleFav}>{saved ? '❤️' : '🤍'}</button>
        </div>
        <p className="sc-addr">📍 {room.address}</p>
        <div className="sc-meta">
          <span className="sc-area">📐 {room.area} m²</span>
          <span className="sc-type">{room.type}</span>
          <span className="sc-time">🕐 {room.postedAt}</span>
        </div>
        <div className="sc-list-footer">
          <span className="sc-price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
          <span className="sc-list-contact">📞 Xem liên hệ</span>
        </div>
      </div>
    </Link>
  );
}
