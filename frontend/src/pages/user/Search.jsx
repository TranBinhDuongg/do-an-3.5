import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Search.css';

const mockRooms = [
  { id: 1, title: 'Phòng trọ cao cấp gần ĐH Bách Khoa', address: '15 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội', price: 3500000, area: 25, type: 'Phòng trọ', available: true, isNew: true, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', postedAt: '2 giờ trước' },
  { id: 2, title: 'Chung cư mini full nội thất, ban công view đẹp', address: '88 Láng Hạ, Đống Đa, Hà Nội', price: 5500000, area: 35, type: 'Chung cư mini', available: true, isNew: false, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', postedAt: '5 giờ trước' },
  { id: 3, title: 'Nhà nguyên căn 3 phòng ngủ, sân vườn rộng', address: '22 Nguyễn Trãi, Thanh Xuân, Hà Nội', price: 12000000, area: 80, type: 'Nhà nguyên căn', available: true, isNew: true, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop', postedAt: '1 ngày trước' },
  { id: 4, title: 'Phòng trọ giá rẻ, gần KCN Thăng Long', address: '5 Phạm Văn Đồng, Bắc Từ Liêm, Hà Nội', price: 1800000, area: 18, type: 'Phòng trọ', available: false, isNew: false, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop', postedAt: '2 ngày trước' },
  { id: 5, title: 'Studio cao cấp trung tâm quận 1, TP.HCM', address: '120 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', price: 8000000, area: 30, type: 'Studio', available: true, isNew: true, image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=250&fit=crop', postedAt: '3 giờ trước' },
  { id: 6, title: 'Phòng trọ sạch sẽ, yên tĩnh, gần ĐH Kinh Tế', address: '45 Đinh Tiên Hoàng, Bình Thạnh, TP. Hồ Chí Minh', price: 2800000, area: 22, type: 'Phòng trọ', available: true, isNew: false, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop', postedAt: '4 ngày trước' },
  { id: 7, title: 'Căn hộ dịch vụ cao cấp, đầy đủ tiện nghi', address: '30 Lê Lợi, Hải Châu, Đà Nẵng', price: 6500000, area: 40, type: 'Căn hộ dịch vụ', available: true, isNew: false, image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop', postedAt: '3 ngày trước' },
  { id: 8, title: 'Ký túc xá sinh viên giá rẻ, an ninh tốt', address: '10 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh', price: 900000, area: 10, type: 'Ký túc xá', available: true, isNew: false, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop', postedAt: '5 ngày trước' },
  { id: 9, title: 'Phòng trọ mới xây, nội thất hiện đại', address: '77 Trần Phú, Hải Châu, Đà Nẵng', price: 3200000, area: 28, type: 'Phòng trọ', available: true, isNew: true, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop', postedAt: '1 giờ trước' },
];

const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
const TYPES  = ['Phòng trọ', 'Chung cư mini', 'Nhà nguyên căn', 'Studio', 'Ký túc xá', 'Căn hộ dịch vụ'];
const PRICES = [
  { label: 'Tất cả', value: '' },
  { label: 'Dưới 2 triệu', value: '2000000' },
  { label: '2 – 4 triệu', value: '4000000' },
  { label: '4 – 6 triệu', value: '6000000' },
  { label: 'Trên 6 triệu', value: '99000000' },
];

export default function Search({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [city, setCity]       = useState(searchParams.get('city') || '');
  const [type, setType]       = useState(searchParams.get('type') || '');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea]   = useState('');
  const [sort, setSort]         = useState('newest');
  const [results, setResults]   = useState(mockRooms);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let data = [...mockRooms];
    if (keyword) data = data.filter(r =>
      r.title.toLowerCase().includes(keyword.toLowerCase()) ||
      r.address.toLowerCase().includes(keyword.toLowerCase())
    );
    if (city)     data = data.filter(r => r.address.includes(city));
    if (type)     data = data.filter(r => r.type === type);
    if (maxPrice) data = data.filter(r => r.price <= parseInt(maxPrice));
    if (minArea)  data = data.filter(r => r.area >= parseInt(minArea));
    if (sort === 'price-asc')  data.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') data.sort((a, b) => b.price - a.price);
    if (sort === 'area-desc')  data.sort((a, b) => b.area - a.area);
    setResults(data);
  }, [keyword, city, type, maxPrice, minArea, sort]);

  const clearFilters = () => {
    setKeyword(''); setCity(''); setType('');
    setMaxPrice(''); setMinArea(''); setSort('newest');
  };

  const activeCount = [city, type, maxPrice, minArea].filter(Boolean).length;

  return (
    <div className="search-page">
      {/* NAVBAR */}
      <nav className="search-nav">
        <div className="search-nav-inner">
          <Link to="/" className="search-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="search-nav-links">
            <Link to="/" className="search-nav-link">Trang chủ</Link>
            <Link to="/search" className="search-nav-link active">Tìm phòng</Link>
          </div>
          <div className="search-nav-auth">
            {user ? (
              <div className="search-nav-user">
                <button className="search-nav-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="search-nav-avatar">{user.name?.charAt(0)}</div>
                  <span>{user.name}</span> <span>▾</span>
                </button>
                {menuOpen && (
                  <div className="search-nav-dropdown">
                    <Link to="/profile" className="search-nav-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                    <hr className="search-nav-drop-hr" />
                    <button className="search-nav-drop-logout" onClick={() => { onLogout(); setMenuOpen(false); }}>🚪 Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="search-nav-btn-outline">Đăng nhập</Link>
                <Link to="/register" className="search-nav-btn-primary">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* TOP SEARCH BAR */}
      <div className="search-topbar">
        <div className="search-topbar-inner">
          <div className="search-topbar-input">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên, địa chỉ, khu vực..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            {keyword && <button className="search-clear-input" onClick={() => setKeyword('')}>✕</button>}
          </div>
          <select value={city} onChange={e => setCity(e.target.value)}>
            <option value="">📍 Tất cả tỉnh/thành</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="">🏠 Loại phòng</option>
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
              {activeCount > 0 && (
                <button className="search-filter-clear" onClick={clearFilters}>Xóa tất cả</button>
              )}
            </div>

            {/* Loại phòng */}
            <div className="search-filter-group">
              <p className="search-filter-label">Loại phòng</p>
              <div className="search-filter-tags">
                <button className={`search-filter-tag ${type === '' ? 'active' : ''}`} onClick={() => setType('')}>Tất cả</button>
                {TYPES.map(t => (
                  <button key={t} className={`search-filter-tag ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
                ))}
              </div>
            </div>

            {/* Mức giá */}
            <div className="search-filter-group">
              <p className="search-filter-label">Mức giá</p>
              {PRICES.map(p => (
                <label key={p.label} className="search-filter-radio">
                  <input type="radio" name="price" value={p.value}
                    checked={maxPrice === p.value}
                    onChange={e => setMaxPrice(e.target.value)} />
                  {p.label}
                </label>
              ))}
            </div>

            {/* Diện tích */}
            <div className="search-filter-group">
              <p className="search-filter-label">Diện tích tối thiểu</p>
              <div className="search-area-btns">
                {[{ l: 'Tất cả', v: '' }, { l: '≥ 15m²', v: '15' }, { l: '≥ 25m²', v: '25' }, { l: '≥ 40m²', v: '40' }].map(a => (
                  <button key={a.l} className={`search-area-btn ${minArea === a.v ? 'active' : ''}`}
                    onClick={() => setMinArea(a.v)}>{a.l}</button>
                ))}
              </div>
            </div>

            {/* Tỉnh thành */}
            <div className="search-filter-group">
              <p className="search-filter-label">Tỉnh / Thành phố</p>
              {CITIES.map(c => (
                <label key={c} className="search-filter-radio">
                  <input type="radio" name="city" value={c}
                    checked={city === c}
                    onChange={e => setCity(e.target.value)} />
                  {c}
                </label>
              ))}
              <label className="search-filter-radio">
                <input type="radio" name="city" value=""
                  checked={city === ''}
                  onChange={() => setCity('')} />
                Tất cả
              </label>
            </div>
          </div>
        </aside>

        {/* MAIN RESULTS */}
        <main className="search-main">
          {/* Result header */}
          <div className="search-result-bar">
            <p className="search-result-count">
              Tìm thấy <strong>{results.length}</strong> phòng
              {keyword && <span> cho "<em>{keyword}</em>"</span>}
            </p>
            <div className="search-result-controls">
              <select value={sort} onChange={e => setSort(e.target.value)} className="search-sort-select">
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

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="search-active-filters">
              {city     && <span className="search-chip">📍 {city} <button onClick={() => setCity('')}>✕</button></span>}
              {type     && <span className="search-chip">🏠 {type} <button onClick={() => setType('')}>✕</button></span>}
              {maxPrice && <span className="search-chip">💰 {PRICES.find(p => p.value === maxPrice)?.label} <button onClick={() => setMaxPrice('')}>✕</button></span>}
              {minArea  && <span className="search-chip">📐 ≥ {minArea}m² <button onClick={() => setMinArea('')}>✕</button></span>}
            </div>
          )}

          {/* Empty */}
          {results.length === 0 ? (
            <div className="search-empty">
              <span>🔍</span>
              <h3>Không tìm thấy phòng phù hợp</h3>
              <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button onClick={clearFilters} className="search-empty-btn">Xóa bộ lọc</button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="search-grid">
              {results.map(room => <RoomCard key={room.id} room={room} />)}
            </div>
          ) : (
            <div className="search-list">
              {results.map(room => <RoomListItem key={room.id} room={room} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function RoomCard({ room }) {
  return (
    <Link to={`/room/${room.id}`} className="sc-card">
      <div className="sc-card-img">
        <img src={room.image} alt={room.title} />
        <span className={`sc-badge ${room.available ? 'green' : 'red'}`}>
          {room.available ? 'Còn phòng' : 'Hết phòng'}
        </span>
        {room.isNew && <span className="sc-new">Mới</span>}
        <button className="sc-save" onClick={e => e.preventDefault()}>🤍</button>
      </div>
      <div className="sc-body">
        <h3 className="sc-title">{room.title}</h3>
        <p className="sc-addr">📍 {room.address}</p>
        <div className="sc-meta">
          <span className="sc-area">📐 {room.area} m²</span>
          <span className="sc-type">{room.type}</span>
        </div>
        <div className="sc-footer">
          <span className="sc-price">{room.price.toLocaleString('vi-VN')}đ/tháng</span>
          <span className="sc-time">{room.postedAt}</span>
        </div>
      </div>
    </Link>
  );
}

function RoomListItem({ room }) {
  return (
    <Link to={`/room/${room.id}`} className="sc-list-item">
      <div className="sc-list-img">
        <img src={room.image} alt={room.title} />
        <span className={`sc-badge ${room.available ? 'green' : 'red'}`}>
          {room.available ? 'Còn phòng' : 'Hết phòng'}
        </span>
      </div>
      <div className="sc-list-body">
        <div className="sc-list-top">
          <h3 className="sc-title">{room.title}</h3>
          <button className="sc-save" onClick={e => e.preventDefault()}>🤍</button>
        </div>
        <p className="sc-addr">📍 {room.address}</p>
        <div className="sc-meta">
          <span className="sc-area">📐 {room.area} m²</span>
          <span className="sc-type">{room.type}</span>
          <span className="sc-time">🕐 {room.postedAt}</span>
        </div>
        <div className="sc-list-footer">
          <span className="sc-price">{room.price.toLocaleString('vi-VN')}đ/tháng</span>
          <span className="sc-list-contact">📞 Xem liên hệ</span>
        </div>
      </div>
    </Link>
  );
}
