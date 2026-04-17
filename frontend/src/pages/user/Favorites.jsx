import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFavoritesApi, removeFavoriteApi } from '../../api/rooms';
import './Favorites.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';

function formatPrice(p) {
  if (!p) return 'Thỏa thuận';
  if (p >= 1000000) return (p / 1000000).toFixed(1).replace('.0', '') + ' triệu/tháng';
  return p.toLocaleString('vi-VN') + ' đ/tháng';
}

export default function Favorites({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getFavoritesApi()
      .then(d => setRooms(d.rooms))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (roomId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeFavoriteApi(roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fav-wrap">
      {/* NAVBAR */}
      <nav className="fav-nav">
        <div className="fav-nav-inner">
          <Link to="/" className="fav-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="fav-nav-links">
            <Link to="/" className="fav-nav-link">Trang chủ</Link>
            <Link to="/search" className="fav-nav-link">Tìm phòng</Link>
            <Link to="/favorites" className="fav-nav-link active">Yêu thích</Link>
          </div>
          <div className="fav-nav-auth">
            {user ? (
              <div className="fav-nav-user">
                <button className="fav-nav-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="fav-nav-avatar">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="avatar" />
                      : user.name?.charAt(0)}
                  </div>
                  <div className="fav-nav-user-info">
                    <span className="fav-nav-user-name">{user.name}</span>
                    <span className="fav-nav-user-role">Người thuê</span>
                  </div>
                  <span>▾</span>
                </button>
                {menuOpen && (
                  <div className="fav-nav-dropdown">
                    <Link to="/profile" className="fav-nav-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                    <Link to="/favorites" className="fav-nav-drop-item" onClick={() => setMenuOpen(false)}>❤️ Yêu thích</Link>
                    <hr className="fav-nav-drop-hr" />
                    <button className="fav-nav-drop-logout" onClick={() => { onLogout(); setMenuOpen(false); navigate('/login'); }}>🚪 Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="fav-nav-btn-outline">Đăng nhập</Link>
                <Link to="/register" className="fav-nav-btn-primary">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <div className="fav-header">
        <div className="fav-header-inner">
          <div>
            <h1 className="fav-header-title">❤️ Phòng yêu thích</h1>
            <p className="fav-header-sub">{rooms.length} phòng đã lưu</p>
          </div>
          <Link to="/search" className="fav-header-btn">🔍 Tìm thêm phòng</Link>
        </div>
      </div>

      {/* CONTENT */}
      <div className="fav-body">
        {loading ? (
          <div className="fav-empty"><span>⏳</span><h3>Đang tải...</h3></div>
        ) : !user ? (
          <div className="fav-empty">
            <span>🔒</span>
            <h3>Vui lòng đăng nhập</h3>
            <p>Bạn cần đăng nhập để xem danh sách yêu thích.</p>
            <Link to="/login" className="fav-empty-btn">Đăng nhập ngay</Link>
          </div>
        ) : rooms.length === 0 ? (
          <div className="fav-empty">
            <span>💔</span>
            <h3>Chưa có phòng yêu thích</h3>
            <p>Nhấn vào biểu tượng ❤️ trên các tin đăng để lưu lại những phòng bạn thích.</p>
            <Link to="/search" className="fav-empty-btn">Khám phá phòng ngay</Link>
          </div>
        ) : (
          <div className="fav-grid">
            {rooms.map(room => (
              <Link key={room.id} to={`/search?id=${room.id}`} className="fav-card">
                <div className="fav-card-img">
                  <img
                    src={room.image || FALLBACK_IMG}
                    alt={room.title}
                    onError={e => { e.target.src = FALLBACK_IMG; }}
                  />
                  <span className={`fav-badge ${room.available ? 'green' : 'red'}`}>
                    {room.available ? 'Còn phòng' : 'Hết phòng'}
                  </span>
                  {room.isFeatured && <span className="fav-featured">⭐ Nổi bật</span>}
                  <button
                    className="fav-remove-btn"
                    onClick={(e) => handleRemove(room.id, e)}
                    title="Xóa khỏi yêu thích"
                  >
                    ❤️
                  </button>
                </div>
                <div className="fav-card-body">
                  <h3 className="fav-card-title">{room.title}</h3>
                  <p className="fav-card-addr">📍 {room.address}</p>
                  <div className="fav-card-meta">
                    <span className="fav-card-area">📐 {room.area} m²</span>
                    <span className="fav-card-type">{room.type}</span>
                  </div>
                  <div className="fav-card-footer">
                    <span className="fav-card-price">{formatPrice(room.price)}</span>
                    <span className="fav-card-saved">🕐 {room.savedAt}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
