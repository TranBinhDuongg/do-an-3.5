import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getRoomDetailEmployerApi, updateRoomStatusApi, deleteRoomApi } from '../../api/employer';
import { getReviewsApi } from '../../api/rooms';
import NotificationBell from '../../components/NotificationBell';
import EmployerNavbar from '../../components/EmployerNavbar';
import './Home.css';
import './RoomDetail.css';

const FALLBACK = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop';

const STATUS_LABEL = {
  approved: { text: 'Đã duyệt',  cls: 'approved', icon: '✅' },
  pending:  { text: 'Chờ duyệt', cls: 'pending',  icon: '⏳' },
  rejected: { text: 'Từ chối',   cls: 'rejected', icon: '❌' },
  paused:   { text: 'Tạm dừng',  cls: 'paused',   icon: '⏸' },
};

function ErdStars({ stars }) {
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  return (
    <div className="erd-stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`erd-star-icon ${i <= full ? 'full' : (i === full + 1 && half ? 'half' : 'empty')}`}>★</span>
      ))}
    </div>
  );
}

function RoomMap({ lat, lon, address, city }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const [coords, setCoords] = useState(
    lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null
  );
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (coords) return;
    setGeocoding(true);
    const q = encodeURIComponent(`${address}, ${city}, Việt Nam`);
    fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=vn`)
      .then(r => r.json())
      .then(data => { if (data[0]) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }); })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, [address, city]);

  useEffect(() => {
    if (!coords || !mapRef.current || mapInst.current) return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    import('leaflet').then(L => {
      const map = L.map(mapRef.current, { center: [coords.lat, coords.lon], zoom: 16 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      });
      L.marker([coords.lat, coords.lon], { icon }).addTo(map)
        .bindPopup(`<b>${address}</b><br/>${city}`).openPopup();
      mapInst.current = map;
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [coords]);

  if (geocoding) return (
    <div className="erd-map-placeholder"><span style={{ fontSize: 28 }}>⏳</span><p>Đang tải bản đồ...</p></div>
  );

  if (!coords) return (
    <div className="erd-map-placeholder">
      <span>🗺</span>
      <p>{address}, {city}</p>
      <a href={`https://maps.google.com/?q=${encodeURIComponent(address + ', ' + city)}`}
        target="_blank" rel="noreferrer" className="erd-map-link">Xem trên Google Maps →</a>
    </div>
  );

  return (
    <div className="erd-map-wrap">
      <div ref={mapRef} className="erd-map" />
      <a href={`https://maps.google.com/?q=${coords.lat},${coords.lon}`} target="_blank" rel="noreferrer" className="erd-map-ext-link">
        🗺 Mở Google Maps →
      </a>
    </div>
  );
}

export default function EmployerRoomDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [imgIdx, setImgIdx]     = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reviews, setReviews]       = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average: 0 });

  useEffect(() => {
    getRoomDetailEmployerApi(id)
      .then(d => setRoom(d.room))
      .catch(() => navigate('/employer/rooms'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getReviewsApi(id)
      .then(d => { setReviews(d.reviews); setReviewStats({ total: d.total, average: d.average }); })
      .catch(() => {});
  }, [id]);

  const handleToggleStatus = async () => {
    const newStatus = room.status === 'paused' ? 'approved' : 'paused';
    try {
      await updateRoomStatusApi(room.id, newStatus);
      setRoom(prev => ({ ...prev, status: newStatus }));
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  const handleDelete = async () => {
    try {
      await deleteRoomApi(room.id);
      navigate('/employer/rooms');
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  const images = room?.images?.length ? room.images : [FALLBACK];
  const st = room ? STATUS_LABEL[room.status] : null;

  if (loading) return (
    <div className="erd-loading">
      <div className="erd-spinner" /><p>Đang tải...</p>
    </div>
  );
  if (!room) return null;

  return (
    <div className="emp-page">
      {/* NAVBAR */}
      <EmployerNavbar user={user} onLogout={onLogout} />

      <div className="emp-body">
        {/* BREADCRUMB */}
        <div className="erd-breadcrumb">
          <Link to="/employer/rooms">← Quay lại danh sách</Link>
        </div>

        <div className="erd-layout">
          {/* LEFT */}
          <div className="erd-main">

            {/* GALLERY */}
            <div className="erd-gallery">
              <div className="erd-gallery-main" onClick={() => setLightbox(true)}>
                <img src={images[imgIdx] || FALLBACK} alt={room.title}
                  onError={e => { e.target.src = FALLBACK; }} />
                <span className="erd-gallery-count">📷 {images.length} ảnh</span>
              </div>
              {images.length > 1 && (
                <div className="erd-thumbs">
                  {images.map((img, i) => (
                    <button key={i} className={`erd-thumb ${i === imgIdx ? 'active' : ''}`}
                      onClick={() => setImgIdx(i)}>
                      <img src={img} alt="" onError={e => { e.target.src = FALLBACK; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TITLE */}
            <div className="erd-card">
              <div className="erd-title-row">
                <div>
                  <div className="erd-badges">
                    <span className={`erd-status ${st?.cls}`}>{st?.icon} {st?.text}</span>
                    <span className="erd-badge-type">{room.type}</span>
                    {room.isFeatured && <span className="erd-badge-featured">⭐ Nổi bật</span>}
                  </div>
                  <h1 className="erd-title">{room.title}</h1>
                  <p className="erd-addr">📍 {room.address}{room.district ? `, ${room.district}` : ''}, {room.city}</p>
                </div>
                <div className="erd-actions">
                  {(room.status === 'approved' || room.status === 'paused') && (
                    <button className={`erd-btn-toggle ${room.status === 'paused' ? 'inactive' : ''}`}
                      onClick={handleToggleStatus}>
                      {room.status === 'paused' ? '▶ Kích hoạt' : '⏸ Tạm dừng'}
                    </button>
                  )}
                  <Link to={`/employer/rooms/${room.id}/edit`} className="erd-btn-edit">✏️ Sửa tin</Link>
                  <button className="erd-btn-delete" onClick={() => setConfirmDelete(true)}>🗑️ Xóa tin</button>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="erd-stats-grid">
              {[
                { icon: '💰', label: 'Giá thuê',   value: `${Number(room.price).toLocaleString('vi-VN')}đ/tháng`, cls: 'price' },
                { icon: '📐', label: 'Diện tích',  value: `${room.area} m²` },
                { icon: '💵', label: 'Tiền cọc',   value: room.deposit ? `${Number(room.deposit).toLocaleString('vi-VN')}đ` : '—' },
                { icon: '👁️', label: 'Lượt xem',   value: room.views },
                { icon: '📞', label: 'Liên hệ',    value: room.contacts },
                { icon: '❤️', label: 'Lượt lưu',   value: room.saved },
              ].map(s => (
                <div key={s.label} className="erd-stat-item">
                  <span className="erd-stat-icon">{s.icon}</span>
                  <div>
                    <p className="erd-stat-label">{s.label}</p>
                    <strong className={`erd-stat-value ${s.cls || ''}`}>{s.value}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* AMENITIES */}
            {room.amenities?.length > 0 && (
              <div className="erd-card">
                <h2 className="erd-section-title">🛠 Tiện ích</h2>
                <div className="erd-amenities">
                  {room.amenities.map(a => (
                    <span key={a.key} className="erd-amenity">{a.icon || '✔'} {a.label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            {room.description && (
              <div className="erd-card">
                <h2 className="erd-section-title">📋 Mô tả</h2>
                <div className="erd-desc">
                  {room.description.split('\n').map((l, i) => <p key={i}>{l}</p>)}
                </div>
              </div>
            )}

            {/* MAP */}
            <div className="erd-card">
              <h2 className="erd-section-title">📍 Vị trí trên bản đồ</h2>
              <RoomMap lat={room.lat} lon={room.lon} address={room.address} city={room.city} />
            </div>

            {/* REVIEWS */}
            <div className="erd-card">
              <div className="erd-review-header">
                <h2 className="erd-section-title" style={{ margin: 0 }}>
                  ⭐ Đánh giá từ người thuê ({reviewStats.total})
                </h2>
                {reviewStats.total > 0 && (
                  <div className="erd-review-avg">
                    <span className="erd-review-avg-num">{reviewStats.average}</span>
                    <ErdStars stars={reviewStats.average} />
                  </div>
                )}
              </div>

              {/* Phân bổ sao */}
              {reviewStats.total > 0 && (
                <div className="erd-star-breakdown">
                  {[5,4,3,2,1].map(s => {
                    const count = reviews.filter(r => r.stars === s).length;
                    const pct = reviewStats.total ? Math.round((count / reviewStats.total) * 100) : 0;
                    return (
                      <div key={s} className="erd-star-row">
                        <span className="erd-star-row-label">{s} ★</span>
                        <div className="erd-star-bar-wrap">
                          <div className="erd-star-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="erd-star-row-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="erd-no-reviews">Chưa có đánh giá nào cho nhà này.</p>
              ) : (
                <div className="erd-review-list">
                  {reviews.map(rv => (
                    <div key={rv.id} className="erd-review-item">
                      <div className="erd-review-user">
                        <div className="erd-review-avatar">
                          {rv.userAvatar
                            ? <img src={rv.userAvatar} alt={rv.userName} />
                            : rv.userName?.charAt(0)}
                        </div>
                        <div>
                          <p className="erd-review-name">{rv.userName}</p>
                          <p className="erd-review-date">{new Date(rv.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <ErdStars stars={rv.stars} />
                      </div>
                      {rv.content && <p className="erd-review-content">{rv.content}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="erd-sidebar">
            {/* Thông tin liên hệ */}
            <div className="erd-card">
              <h3 className="erd-section-title">📞 Thông tin liên hệ</h3>
              <div className="erd-contact-list">
                <div className="erd-contact-row"><span>Họ tên</span><strong>{room.contactName}</strong></div>
                <div className="erd-contact-row"><span>SĐT</span><strong>{room.contactPhone}</strong></div>
                {room.contactEmail && <div className="erd-contact-row"><span>Email</span><strong>{room.contactEmail}</strong></div>}
                <div className="erd-contact-row"><span>Hiện SĐT</span><strong>{room.showPhone ? '✅ Có' : '❌ Ẩn'}</strong></div>
              </div>
            </div>

            {/* Thông tin đăng */}
            <div className="erd-card">
              <h3 className="erd-section-title">📅 Thông tin đăng</h3>
              <div className="erd-contact-list">
                <div className="erd-contact-row"><span>Đăng lúc</span><strong>{room.postedAt}</strong></div>
                <div className="erd-contact-row"><span>Cập nhật</span><strong>{room.updatedAt}</strong></div>
                <div className="erd-contact-row"><span>Trạng thái</span>
                  <strong className={`erd-status-inline ${st?.cls}`}>{st?.icon} {st?.text}</strong>
                </div>
                <div className="erd-contact-row"><span>Tình trạng</span>
                  <strong>{room.available ? '✅ Còn nhà' : '❌ Hết nhà'}</strong>
                </div>
              </div>
            </div>


          </aside>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="erd-lightbox" onClick={() => setLightbox(false)}>
          <button className="erd-lb-close">✕</button>
          <button className="erd-lb-prev" onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length); }}>‹</button>
          <img src={images[imgIdx]} alt="" onClick={e => e.stopPropagation()} onError={e => { e.target.src = FALLBACK; }} />
          <button className="erd-lb-next" onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length); }}>›</button>
          <span className="erd-lb-count">{imgIdx + 1} / {images.length}</span>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="rooms-modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="rooms-modal" onClick={e => e.stopPropagation()}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa tin đăng này? Hành động này không thể hoàn tác.</p>
            <div className="rooms-modal-actions">
              <button className="rooms-modal-cancel" onClick={() => setConfirmDelete(false)}>Hủy</button>
              <button className="rooms-modal-confirm" onClick={handleDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
