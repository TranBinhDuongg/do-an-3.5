import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getRoomDetailEmployerApi, updateRoomStatusApi, deleteRoomApi } from '../../api/employer';
import NotificationBell from '../../components/NotificationBell';
import './Home.css';
import './RoomDetail.css';

const FALLBACK = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=500&fit=crop';

const STATUS_LABEL = {
  approved: { text: 'Đã duyệt',  cls: 'approved', icon: '✅' },
  pending:  { text: 'Chờ duyệt', cls: 'pending',  icon: '⏳' },
  rejected: { text: 'Từ chối',   cls: 'rejected', icon: '❌' },
  paused:   { text: 'Tạm dừng',  cls: 'paused',   icon: '⏸' },
};

export default function EmployerRoomDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [imgIdx, setImgIdx]     = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getRoomDetailEmployerApi(id)
      .then(d => setRoom(d.room))
      .catch(() => navigate('/employer/rooms'))
      .finally(() => setLoading(false));
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
      <nav className="emp-nav">
        <div className="emp-nav-inner">
          <Link to="/" className="emp-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="emp-nav-links">
            <Link to="/employer"         className="emp-nav-link">Tổng quan</Link>
            <Link to="/employer/rooms"   className="emp-nav-link active">Tin đăng</Link>
            <Link to="/employer/pricing" className="emp-nav-link emp-nav-link-pricing">💎 Mua gói</Link>
          </div>
          <div className="emp-nav-right">
            <NotificationBell user={user} />
            <div className="emp-user-wrap">
              <button className="emp-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="emp-avatar">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : user?.name?.charAt(0) || 'C'}
                </div>
                <div className="emp-user-info">
                  <span className="emp-user-name">{user?.name || 'Chủ trọ'}</span>
                  <span className="emp-user-role">Chủ trọ</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="emp-user-dropdown">
                  <Link to="/profile" className="emp-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                  <hr className="emp-drop-hr" />
                  <button className="emp-drop-logout" onClick={() => { onLogout?.(); navigate('/login'); }}>🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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
                  <strong>{room.available ? '✅ Còn phòng' : '❌ Hết phòng'}</strong>
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
