import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFavoritesApi, removeFavoriteApi } from '../../api/rooms';
import UserNavbar from '../../components/UserNavbar';
import './Favorites.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';
const ITEMS_PER_PAGE = 12;

function formatPrice(p) {
  if (!p) return 'Thỏa thuận';
  if (p >= 1000000) return (p / 1000000).toFixed(1).replace('.0', '') + ' triệu/tháng';
  return p.toLocaleString('vi-VN') + ' đ/tháng';
}

export default function Favorites({ user, onLogout }) {
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const navigate = useNavigate();

  const totalPages = Math.max(1, Math.ceil(allRooms.length / ITEMS_PER_PAGE));
  const rooms = allRooms.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getFavoritesApi()
      .then(d => setAllRooms(d.rooms))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { setPageInput(String(page)); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

  // Reset to page 1 if current page exceeds total after removal
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const handleRemove = async (roomId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeFavoriteApi(roomId);
      setAllRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fav-wrap">
      {/* NAVBAR */}
      <UserNavbar user={user} onLogout={onLogout} />

      {/* HEADER */}
      <div className="fav-header">
        <div className="fav-header-inner">
          <div>
            <h1 className="fav-header-title">❤️ Nhà yêu thích</h1>
            <p className="fav-header-sub">{allRooms.length} nhà đã lưu</p>
          </div>
          <Link to="/search" className="fav-header-btn">🔍 Tìm thêm nhà</Link>
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
        ) : allRooms.length === 0 ? (
          <div className="fav-empty">
            <span>💔</span>
            <h3>Chưa có nhà yêu thích</h3>
            <p>Nhấn vào biểu tượng ❤️ trên các tin đăng để lưu lại những nhà bạn thích.</p>
            <Link to="/search" className="fav-empty-btn">Khám phá nhà ngay</Link>
          </div>
        ) : (
          <>
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
                      {room.available ? 'Còn nhà' : 'Hết nhà'}
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

            {totalPages > 1 && (
              <div className="fav-pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                <span className="fav-pagination-info">
                  Trang
                  <input
                    type="number"
                    className="fav-pagination-input"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={e => setPageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(pageInput, 10);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) setPage(val);
                        else setPageInput(String(page));
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(pageInput, 10);
                      if (!isNaN(val) && val >= 1 && val <= totalPages) setPage(val);
                      else setPageInput(String(page));
                    }}
                  />
                  / {totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
