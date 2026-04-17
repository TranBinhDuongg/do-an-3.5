import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Pricing.css';

const plans = [
  {
    id: 'basic',
    name: 'Cơ bản',
    price: 29000,
    duration: 7,
    posts: 1,
    color: 'gray',
    badge: null,
    features: [
      '1 tin đăng',
      'Hiển thị 7 ngày',
      'Vị trí thường',
      'Hỗ trợ qua email',
    ],
    notIncluded: [
      'Tin nổi bật',
      'Đẩy tin lên đầu',
      'Huy hiệu ưu tiên',
    ],
  },
  {
    id: 'standard',
    name: 'Tiêu chuẩn',
    price: 79000,
    duration: 30,
    posts: 3,
    color: 'blue',
    badge: 'Phổ biến',
    features: [
      '3 tin đăng',
      'Hiển thị 30 ngày',
      'Tin nổi bật',
      'Đẩy tin lên đầu 2 lần',
      'Hỗ trợ qua email & điện thoại',
    ],
    notIncluded: [
      'Huy hiệu ưu tiên',
    ],
  },
  {
    id: 'premium',
    name: 'Cao cấp',
    price: 149000,
    duration: 30,
    posts: 10,
    color: 'gold',
    badge: 'Tốt nhất',
    features: [
      '10 tin đăng',
      'Hiển thị 30 ngày',
      'Tin nổi bật & ưu tiên',
      'Đẩy tin lên đầu không giới hạn',
      'Huy hiệu "Chủ trọ uy tín"',
      'Hỗ trợ 24/7 ưu tiên',
      'Thống kê chi tiết',
    ],
    notIncluded: [],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 299000,
    duration: 90,
    posts: 999,
    color: 'purple',
    badge: 'VIP',
    features: [
      'Đăng tin không giới hạn',
      'Hiển thị 90 ngày',
      'Vị trí số 1 trang chủ',
      'Đẩy tin tự động mỗi ngày',
      'Huy hiệu VIP nổi bật',
      'Hỗ trợ riêng 24/7',
      'Thống kê & báo cáo nâng cao',
      'Tư vấn đăng tin miễn phí',
    ],
    notIncluded: [],
  },
];

export default function Pricing({ user, onLogout }) {
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleBuy = (plan) => {
    setSelected(plan);
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    navigate('/employer/post');
  };

  return (
    <div className="pricing-page">
      {/* NAVBAR */}
      <nav className="pricing-nav">
        <div className="pricing-nav-inner">
          <Link to="/" className="pricing-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="pricing-nav-links">
            <Link to="/employer"         className="pricing-nav-link">Tổng quan</Link>
            <Link to="/employer/rooms"   className="pricing-nav-link">Tin đăng</Link>
            <Link to="/employer/pricing" className="pricing-nav-link active pricing-nav-link-gold">💎 Mua gói</Link>
          </div>
          <div className="pricing-nav-right">
            <div className="emp-noti-wrap">
              <button className="emp-noti-btn" onClick={() => { setNotiOpen(!notiOpen); setMenuOpen(false); }}>
                🔔
              </button>
              {notiOpen && (
                <div className="emp-noti-dropdown">
                  <div className="emp-noti-header">
                    <strong>Thông báo</strong>
                    <button>Đánh dấu đã đọc</button>
                  </div>
                  <div className="emp-noti-item">
                    <span className="emp-noti-icon">📋</span>
                    <div><p>Chưa có thông báo mới</p></div>
                  </div>
                </div>
              )}
            </div>
            <div className="pricing-user-wrap">
              <button className="pricing-user-btn" onClick={() => { setMenuOpen(!menuOpen); setNotiOpen(false); }}>
                <div className="pricing-avatar">
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt="avatar" />
                    : (user?.name?.charAt(0) || 'C')}
                </div>
                <div className="emp-user-info">
                  <span className="emp-user-name">{user?.name || 'Chủ trọ'}</span>
                  <span className="emp-user-role">Chủ trọ</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="pricing-dropdown">
                  <Link to="/profile" className="pricing-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                  <Link to="/employer/settings" className="pricing-drop-item" onClick={() => setMenuOpen(false)}>⚙️ Cài đặt</Link>
                  <hr className="pricing-drop-hr" />
                  <Link to="/" className="pricing-drop-item" onClick={() => setMenuOpen(false)}>🔍 Xem trang người thuê</Link>
                  <hr className="pricing-drop-hr" />
                  <button className="pricing-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); navigate('/login'); }}>🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pricing-body">
        {/* Header */}
        <div className="pricing-header">
          <h1>Chọn gói đăng tin</h1>
          <p>Mua gói phù hợp để bắt đầu đăng tin cho thuê phòng trọ của bạn</p>
        </div>

        {/* Current plan */}
        <div className="pricing-current">
          <span>📋 Gói hiện tại của bạn:</span>
          <strong>Chưa có gói</strong>
          <span className="pricing-current-exp">— Mua gói để bắt đầu đăng tin</span>
        </div>

        {/* Plans grid */}
        <div className="pricing-grid">
          {plans.map(plan => (
            <div key={plan.id} className={`pricing-card pricing-card-${plan.color} ${plan.id === 'premium' ? 'featured' : ''}`}>
              {plan.badge && (
                <div className={`pricing-badge pricing-badge-${plan.color}`}>{plan.badge}</div>
              )}

              <div className="pricing-card-header">
                <h2 className="pricing-plan-name">{plan.name}</h2>
                <div className="pricing-price">
                  <span className="pricing-amount">{plan.price.toLocaleString('vi-VN')}đ</span>
                  <span className="pricing-period">/ {plan.duration} ngày</span>
                </div>
                <div className="pricing-posts">
                  {plan.posts === 999 ? 'Không giới hạn tin đăng' : `${plan.posts} tin đăng`}
                </div>
              </div>

              <ul className="pricing-features">
                {plan.features.map(f => (
                  <li key={f} className="pricing-feature included">
                    <span className="pricing-check">✓</span> {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="pricing-feature not-included">
                    <span className="pricing-x">✕</span> {f}
                  </li>
                ))}
              </ul>

              <button
                className={`pricing-buy-btn pricing-buy-${plan.color}`}
                onClick={() => handleBuy(plan)}
              >
                {plan.id === 'vip' ? '👑 Mua ngay' : 'Mua gói này'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="pricing-faq">
          <h2>Câu hỏi thường gặp</h2>
          <div className="pricing-faq-grid">
            {[
              { q: 'Gói có tự động gia hạn không?', a: 'Không, gói không tự động gia hạn. Bạn cần mua lại khi hết hạn.' },
              { q: 'Có thể nâng cấp gói không?', a: 'Có, bạn có thể nâng cấp lên gói cao hơn bất kỳ lúc nào.' },
              { q: 'Thanh toán bằng hình thức nào?', a: 'Hỗ trợ chuyển khoản ngân hàng, ví MoMo, ZaloPay, thẻ ATM/Visa.' },
              { q: 'Tin đăng có được duyệt ngay không?', a: 'Tin đăng sẽ được duyệt trong vòng 2-4 giờ làm việc.' },
            ].map(item => (
              <div key={item.q} className="pricing-faq-item">
                <h4>❓ {item.q}</h4>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && selected && (
        <div className="pricing-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pricing-modal" onClick={e => e.stopPropagation()}>
            <button className="pricing-modal-close" onClick={() => setShowModal(false)}>✕</button>
            <h2>Xác nhận mua gói</h2>
            <div className={`pricing-modal-plan pricing-card-${selected.color}`}>
              <strong>{selected.name}</strong>
              <span>{selected.price.toLocaleString('vi-VN')}đ / {selected.duration} ngày</span>
            </div>

            <div className="pricing-modal-methods">
              <p>Chọn phương thức thanh toán:</p>
              <div className="pricing-payment-grid">
                {[
                  { icon: '🏦', label: 'Chuyển khoản ngân hàng' },
                  { icon: '💜', label: 'Ví MoMo' },
                  { icon: '🔵', label: 'ZaloPay' },
                  { icon: '💳', label: 'Thẻ ATM / Visa' },
                ].map(m => (
                  <button key={m.label} className="pricing-payment-btn">
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pricing-modal-total">
              <span>Tổng thanh toán:</span>
              <strong>{selected.price.toLocaleString('vi-VN')}đ</strong>
            </div>

            <button className="pricing-modal-confirm" onClick={handleConfirm}>
              ✅ Xác nhận thanh toán
            </button>
            <p className="pricing-modal-note">
              * Sau khi thanh toán, gói sẽ được kích hoạt trong vòng 5 phút
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
