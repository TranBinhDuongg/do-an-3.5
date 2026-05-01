import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getRoomDetailApi, addFavoriteApi, removeFavoriteApi, checkFavoriteApi, getReviewsApi, postReviewApi, deleteReviewApi, updateReviewApi } from '../../api/rooms';
import { startConversationApi } from '../../api/messages';
import UserNavbar from '../../components/UserNavbar';
import './RoomDetail.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop';

function RoomMap({ lat, lon, address, city }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const [coords, setCoords] = useState(
    lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null
  );
  const [geocoding, setGeocoding] = useState(false);

  // Nếu không có tọa độ → tự geocode từ địa chỉ
  useEffect(() => {
    if (coords) return;
    setGeocoding(true);
    const q = encodeURIComponent(`${address}, ${city}, Việt Nam`);
    fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=vn`)
      .then(r => r.json())
      .then(data => {
        if (data[0]) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, [address, city]);

  // Khởi tạo map khi có coords
  useEffect(() => {
    if (!coords || !mapRef.current || mapInst.current) return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    import('leaflet').then(L => {
      const map = L.map(mapRef.current, { center: [coords.lat, coords.lon], zoom: 16, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      });
      L.marker([coords.lat, coords.lon], { icon }).addTo(map)
        .bindPopup(`<b>${address}</b><br/>${city}`)
        .openPopup();
      mapInst.current = map;
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [coords]);

  if (geocoding) return (
    <div className="rd-map-placeholder">
      <span style={{ fontSize: 32 }}>⏳</span>
      <p>Đang tải bản đồ...</p>
    </div>
  );

  if (!coords) return (
    <div className="rd-map-placeholder">
      <span>🗺</span>
      <p>{address}, {city}</p>
      <a href={`https://maps.google.com/?q=${encodeURIComponent(address + ', ' + city)}`}
        target="_blank" rel="noreferrer" className="rd-map-link">Xem trên Google Maps →</a>
    </div>
  );

  return (
    <div className="rd-map-real-wrap">
      <div ref={mapRef} className="rd-map-real" />
      <a href={`https://maps.google.com/?q=${coords.lat},${coords.lon}`} target="_blank" rel="noreferrer" className="rd-map-ext-link">
        🗺 Mở Google Maps →
      </a>
    </div>
  );
}

export default function RoomDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average: 0 });
  const [myReview, setMyReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ stars: 5, content: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    setImgIdx(0);
    getRoomDetailApi(id)
      .then(d => { setRoom(d.room); setRelated(d.related); })
      .catch(() => navigate('/search'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    checkFavoriteApi(id).then(d => setSaved(d.saved)).catch(() => {});
  }, [id, user]);

  // Load reviews
  useEffect(() => {
    if (!id) return;
    getReviewsApi(id)
      .then(d => {
        setReviews(d.reviews);
        setReviewStats({ total: d.total, average: d.average });
        if (user) {
          const mine = d.reviews.find(r => r.userName === user.name);
          setMyReview(mine || null);
        }
      })
      .catch(() => {});
  }, [id, user]);

  const toggleFav = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (saved) { await removeFavoriteApi(id); setSaved(false); }
      else        { await addFavoriteApi(id);    setSaved(true);  }
    } catch {}
  };

  const handleChat = async () => {
    if (!user) { navigate('/login'); return; }
    setChatLoading(true);
    try {
      const result = await startConversationApi(room.ownerId, `Xin chào! Tôi quan tâm đến phòng "${room.title}". Phòng còn trống không ạ?`, room.id);
      navigate(`/message?conversationId=${result.ma_ctc}`);
    } catch (err) {
      console.error(err);
      navigate('/message');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewLoading(true);
    setReviewError('');
    try {
      if (editMode) {
        await updateReviewApi(id, reviewForm);
      } else {
        await postReviewApi(id, reviewForm);
      }
      const d = await getReviewsApi(id);
      setReviews(d.reviews);
      setReviewStats({ total: d.total, average: d.average });
      const mine = d.reviews.find(r => r.userName === user.name);
      setMyReview(mine || null);
      setShowReviewForm(false);
      setEditMode(false);
      setReviewForm({ stars: 5, content: '' });
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Xóa đánh giá của bạn?')) return;
    try {
      await deleteReviewApi(id);
      const d = await getReviewsApi(id);
      setReviews(d.reviews);
      setReviewStats({ total: d.total, average: d.average });
      setMyReview(null);
    } catch {}
  };

  const images = room?.images?.length ? room.images : [FALLBACK_IMG];

  if (loading) return (
    <div className="rd-loading-wrap">
      <div className="rd-spinner" />
      <p>Đang tải thông tin phòng...</p>
    </div>
  );

  if (!room) return null;

  return (
    <div className="rd-wrap">
      {/* NAVBAR */}
      <UserNavbar user={user} onLogout={onLogout} />

      {/* BREADCRUMB */}
      <div className="rd-breadcrumb">
        <div className="rd-container">
          <Link to="/">Trang chủ</Link> <span>›</span>
          <Link to="/search">Tìm phòng</Link> <span>›</span>
          <Link to={`/search?city=${room.city}`}>{room.city}</Link> <span>›</span>
          <span className="rd-bc-current">{room.title}</span>
        </div>
      </div>

      <div className="rd-container rd-body">
        {/* LEFT COLUMN */}
        <div className="rd-main">

          {/* IMAGE GALLERY */}
          <div className="rd-gallery">
            <div className="rd-gallery-main" onClick={() => setLightbox(true)}>
              <img src={images[imgIdx] || FALLBACK_IMG} alt={room.title}
                onError={e => { e.target.src = FALLBACK_IMG; }} />
              <span className="rd-gallery-count">📷 {images.length} ảnh</span>
              {!room.available && <div className="rd-sold-overlay">Hết phòng</div>}
            </div>
            {images.length > 1 && (
              <div className="rd-gallery-thumbs">
                {images.map((img, i) => (
                  <button key={i} className={`rd-thumb ${i === imgIdx ? 'active' : ''}`}
                    onClick={() => setImgIdx(i)}>
                    <img src={img} alt="" onError={e => { e.target.src = FALLBACK_IMG; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TITLE + BADGES */}
          <div className="rd-title-row">
            <div>
              <div className="rd-badges">
                <span className={`rd-badge-status ${room.available ? 'green' : 'red'}`}>
                  {room.available ? '✅ Còn phòng' : '❌ Hết phòng'}
                </span>
                {room.isFeatured && <span className="rd-badge-featured">⭐ Nổi bật</span>}
                <span className="rd-badge-type">{room.type}</span>
              </div>
              <h1 className="rd-title">{room.title}</h1>
              <p className="rd-address">📍 {room.address}{room.district ? `, ${room.district}` : ''}, {room.city}</p>
            </div>
            <div className="rd-title-actions">
              <button className={`rd-fav-btn ${saved ? 'saved' : ''}`} onClick={toggleFav} title={saved ? 'Bỏ yêu thích' : 'Lưu yêu thích'}>
                {saved ? '❤️' : '🤍'} {saved ? 'Đã lưu' : 'Lưu tin'}
              </button>
              <button className="rd-share-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)} title="Sao chép link">
                🔗 Chia sẻ
              </button>
            </div>
          </div>

          {/* KEY INFO */}
          <div className="rd-key-info">
            <div className="rd-key-item">
              <span className="rd-key-label">Giá thuê</span>
              <span className="rd-key-value price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
            </div>
            <div className="rd-key-item">
              <span className="rd-key-label">Diện tích</span>
              <span className="rd-key-value">{room.area} m²</span>
            </div>
            {room.deposit && (
              <div className="rd-key-item">
                <span className="rd-key-label">Tiền cọc</span>
                <span className="rd-key-value">{Number(room.deposit).toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="rd-key-item">
              <span className="rd-key-label">Loại phòng</span>
              <span className="rd-key-value">{room.type}</span>
            </div>
            <div className="rd-key-item">
              <span className="rd-key-label">Khu vực</span>
              <span className="rd-key-value">{room.city}</span>
            </div>
            <div className="rd-key-item">
              <span className="rd-key-label">Lượt xem</span>
              <span className="rd-key-value">👁 {room.views}</span>
            </div>
          </div>

          {/* AMENITIES */}
          {room.amenities?.length > 0 && (
            <div className="rd-section">
              <h2 className="rd-section-title">🛠 Tiện ích</h2>
              <div className="rd-amenities">
                {room.amenities.map(a => (
                  <span key={a.key} className="rd-amenity">
                    {a.icon || '✔'} {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          {room.description && (
            <div className="rd-section">
              <h2 className="rd-section-title">📋 Mô tả chi tiết</h2>
              <div className="rd-description">
                {room.description.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* MAP */}
          <div className="rd-section">
            <h2 className="rd-section-title">📍 Vị trí</h2>
            <RoomMap lat={room.lat} lon={room.lon} address={room.address} city={room.city} />
          </div>

          {/* REVIEWS */}
          <div className="rd-section">
            <div className="rd-review-header">
              <h2 className="rd-section-title" style={{ margin: 0 }}>
                ⭐ Đánh giá ({reviewStats.total})
              </h2>
              {reviewStats.total > 0 && (
                <div className="rd-review-avg">
                  <span className="rd-review-avg-num">{reviewStats.average}</span>
                  <StarDisplay stars={reviewStats.average} />
                </div>
              )}
            </div>

            {/* Form đánh giá */}
            {user?.role === 'user' && (
              <div className="rd-review-action">
                {myReview ? (
                  editMode ? (
                    <form className="rd-review-form" onSubmit={handleSubmitReview}>
                      <p className="rd-review-form-title">Sửa đánh giá của bạn</p>
                      <div className="rd-star-picker">
                        {[1,2,3,4,5].map(s => (
                          <button
                            key={s} type="button"
                            className={`rd-star-btn ${s <= reviewForm.stars ? 'active' : ''}`}
                            onClick={() => setReviewForm(f => ({ ...f, stars: s }))}
                          >★</button>
                        ))}
                        <span className="rd-star-label">{reviewForm.stars}/5 sao</span>
                      </div>
                      <textarea
                        className="rd-review-textarea"
                        placeholder="Nhận xét của bạn... (không bắt buộc)"
                        value={reviewForm.content}
                        onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))}
                        rows={3}
                        maxLength={500}
                        autoFocus
                      />
                      {reviewError && <p className="rd-review-error">{reviewError}</p>}
                      <div className="rd-review-form-btns">
                        <button type="submit" className="rd-review-submit-btn" disabled={reviewLoading}>
                          {reviewLoading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                        </button>
                        <button type="button" className="rd-review-cancel-btn" onClick={() => { setEditMode(false); setReviewError(''); }}>
                          Hủy
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      className="rd-my-review rd-my-review-clickable"
                      onClick={() => {
                        setReviewForm({ stars: myReview.stars, content: myReview.content || '' });
                        setEditMode(true);
                        setReviewError('');
                      }}
                      title="Nhấn để sửa đánh giá"
                    >
                      <div className="rd-my-review-top">
                        <p className="rd-my-review-label">Đánh giá của bạn</p>
                        <button className="rd-review-delete-btn" onClick={e => { e.stopPropagation(); handleDeleteReview(); }}>🗑 Xóa</button>
                      </div>
                      <StarDisplay stars={myReview.stars} />
                      {myReview.content && <p className="rd-my-review-content">"{myReview.content}"</p>}
                    </div>
                  )
                ) : showReviewForm ? (
                  <form className="rd-review-form" onSubmit={handleSubmitReview}>
                    <p className="rd-review-form-title">Đánh giá phòng này</p>
                    <div className="rd-star-picker">
                      {[1,2,3,4,5].map(s => (
                        <button
                          key={s} type="button"
                          className={`rd-star-btn ${s <= reviewForm.stars ? 'active' : ''}`}
                          onClick={() => setReviewForm(f => ({ ...f, stars: s }))}
                        >★</button>
                      ))}
                      <span className="rd-star-label">{reviewForm.stars}/5 sao</span>
                    </div>
                    <textarea
                      className="rd-review-textarea"
                      placeholder="Nhận xét của bạn về phòng trọ này... (không bắt buộc)"
                      value={reviewForm.content}
                      onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))}
                      rows={3}
                      maxLength={500}
                    />
                    {reviewError && <p className="rd-review-error">{reviewError}</p>}
                    <div className="rd-review-form-btns">
                      <button type="submit" className="rd-review-submit-btn" disabled={reviewLoading}>
                        {reviewLoading ? 'Đang gửi...' : '✅ Gửi đánh giá'}
                      </button>
                      <button type="button" className="rd-review-cancel-btn" onClick={() => { setShowReviewForm(false); setReviewError(''); }}>
                        Hủy
                      </button>
                    </div>
                  </form>
                ) : (
                  <button className="rd-write-review-btn" onClick={() => setShowReviewForm(true)}>
                    ✏️ Viết đánh giá
                  </button>
                )}
              </div>
            )}

            {/* Danh sách đánh giá */}
            {reviews.length === 0 ? (
              <p className="rd-no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            ) : (
              <div className="rd-review-list">
                {reviews.map(rv => (
                  <div key={rv.id} className="rd-review-item">
                    <div className="rd-review-user">
                      <div className="rd-review-avatar">
                        {rv.userAvatar
                          ? <img src={rv.userAvatar} alt={rv.userName} />
                          : rv.userName?.charAt(0)}
                      </div>
                      <div>
                        <p className="rd-review-name">{rv.userName}</p>
                        <p className="rd-review-date">{new Date(rv.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <StarDisplay stars={rv.stars} />
                    {rv.content && <p className="rd-review-content">{rv.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RELATED */}
          {related.length > 0 && (
            <div className="rd-section">
              <h2 className="rd-section-title">🏠 Phòng tương tự</h2>
              <div className="rd-related-grid">
                {related.map(r => <RelatedCard key={r.id} room={r} />)}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR - CONTACT */}
        <aside className="rd-sidebar">
          <div className="rd-contact-card">
            <div className="rd-contact-owner">
              <div className="rd-owner-avatar">
                {room.ownerAvatar
                  ? <img src={room.ownerAvatar} alt={room.ownerName} />
                  : room.ownerName?.charAt(0)}
              </div>
              <div>
                <p className="rd-owner-name">{room.contactName || room.ownerName}</p>
                <span className="rd-owner-label">Chủ trọ</span>
              </div>
            </div>

            <div className="rd-contact-price">
              <span>{Number(room.price).toLocaleString('vi-VN')}đ</span>
              <small>/tháng</small>
            </div>

            {room.contactPhone ? (
              <div className="rd-contact-actions">
                {showPhone ? (
                  <a href={`tel:${room.contactPhone}`} className="rd-btn-phone">
                    📞 {room.contactPhone}
                  </a>
                ) : (
                  <button className="rd-btn-phone" onClick={() => setShowPhone(true)}>
                    📞 Hiện số điện thoại
                  </button>
                )}
              </div>
            ) : (
              <p className="rd-no-phone">Chủ trọ ẩn số điện thoại</p>
            )}

            {room.contactEmail && (
              <a href={`mailto:${room.contactEmail}`} className="rd-btn-email">
                ✉️ Gửi email
              </a>
            )}

            <button
              className="rd-btn-chat"
              onClick={handleChat}
              disabled={chatLoading}
            >
              {chatLoading ? '⏳ Đang mở...' : '💬 Nhắn tin'}
            </button>

            <div className="rd-contact-info">
              <div className="rd-info-row"><span>📐 Diện tích</span><strong>{room.area} m²</strong></div>
              {room.deposit && <div className="rd-info-row"><span>💰 Tiền cọc</span><strong>{Number(room.deposit).toLocaleString('vi-VN')}đ</strong></div>}
              <div className="rd-info-row"><span>🕐 Đăng</span><strong>{room.postedAt}</strong></div>
            </div>
          </div>

          {/* SAFETY TIPS */}
          <div className="rd-safety-card">
            <h4>⚠️ Lưu ý an toàn</h4>
            <ul>
              <li>Không đặt cọc khi chưa xem phòng trực tiếp</li>
              <li>Kiểm tra hợp đồng trước khi ký</li>
              <li>Xác minh thông tin chủ trọ</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="rd-lightbox" onClick={() => setLightbox(false)}>
          <button className="rd-lb-close">✕</button>
          <button className="rd-lb-prev" onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length); }}>‹</button>
          <img src={images[imgIdx]} alt="" onClick={e => e.stopPropagation()} onError={e => { e.target.src = FALLBACK_IMG; }} />
          <button className="rd-lb-next" onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length); }}>›</button>
          <span className="rd-lb-count">{imgIdx + 1} / {images.length}</span>
        </div>
      )}
    </div>
  );
}

function StarDisplay({ stars }) {
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  return (
    <div className="rd-star-display">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`rd-star ${i <= full ? 'full' : (i === full + 1 && half ? 'half' : 'empty')}`}>★</span>
      ))}
    </div>
  );
}

function RelatedCard({ room }) {
  const FALLBACK = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';
  return (
    <Link to={`/room/${room.id}`} className="rd-related-card">
      <div className="rd-related-img">
        <img src={room.image || FALLBACK} alt={room.title} onError={e => { e.target.src = FALLBACK; }} />
        <span className={`rd-related-badge ${room.available ? 'green' : 'red'}`}>
          {room.available ? 'Còn phòng' : 'Hết phòng'}
        </span>
      </div>
      <div className="rd-related-body">
        <p className="rd-related-title">{room.title}</p>
        <p className="rd-related-addr">📍 {room.address}</p>
        <div className="rd-related-footer">
          <span className="rd-related-price">{Number(room.price).toLocaleString('vi-VN')}đ/tháng</span>
          <span className="rd-related-area">{room.area}m²</span>
        </div>
      </div>
    </Link>
  );
}
