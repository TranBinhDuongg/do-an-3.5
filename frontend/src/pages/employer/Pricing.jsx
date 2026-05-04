import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPackagesApi, getBalanceApi, purchasePackageApi, getMyPackageApi } from '../../api/wallet';
import EmployerNavbar from '../../components/EmployerNavbar';
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
      'Huy hiệu "Chủ nhà uy tín"',
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
  const [selected, setSelected]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [packages, setPackages]   = useState([]);
  const [balance, setBalance]     = useState(0);
  const [loading, setLoading]     = useState(true);
  const [buying, setBuying]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [myPackage, setMyPackage] = useState(null);
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([getPackagesApi(), getBalanceApi(), getMyPackageApi()])
      .then(([pkgRes, balRes, myPkgRes]) => {
        setPackages(pkgRes.packages);
        setBalance(balRes.so_du);
        setMyPackage(myPkgRes.package);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuy = (pkg) => {
    setSelected(pkg);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setBuying(true);
    setError('');
    try {
      const res = await purchasePackageApi(selected.ma_goi);
      setSuccess(res.message);
      loadData(); // Tải lại thông tin gói sau khi mua
      setTimeout(() => {
        setShowModal(false);
        navigate('/employer/post');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="pricing-page">
      {/* NAVBAR */}
      <EmployerNavbar user={user} onLogout={onLogout} />

      <div className="pricing-body">
        {/* Header */}
        <div className="pricing-header">
          <h1>Chọn gói đăng tin</h1>
          <p>Mua gói phù hợp để bắt đầu đăng tin cho thuê nhà cho thuê của bạn</p>
        </div>

        {/* Current plan */}
        <div className="pricing-current">
          <span>📋 Gói hiện tại của bạn:</span>
          {myPackage ? (
            <>
              <strong>{myPackage.name} {myPackage.badge && <span style={{marginLeft: 5, color: '#eab308'}}>({myPackage.badge})</span>}</strong>
              <span className="pricing-current-exp">
                — Còn {myPackage.daysLeft} ngày (Đã đăng: {myPackage.used}/{myPackage.limit} tin, Đã đẩy tin: {myPackage.pushUsed}/{myPackage.pushLimit} lượt)
              </span>
            </>
          ) : (
            <>
              <strong>Chưa có gói</strong>
              <span className="pricing-current-exp">— Mua gói để bắt đầu đăng tin</span>
            </>
          )}
        </div>

        {/* Plans grid */}
        <div className="pricing-grid">
          {loading && <p style={{textAlign:'center',color:'#64748b'}}>Đang tải gói...</p>}
          {packages.map(pkg => (
            <div key={pkg.ma_goi} className={`pricing-card ${pkg.noi_bat ? 'pricing-card-gold featured' : 'pricing-card-gray'}`}>
              {pkg.noi_bat && <div className="pricing-badge pricing-badge-gold">Nổi bật</div>}
              <div className="pricing-card-header">
                <h2 className="pricing-plan-name">{pkg.ten_goi}</h2>
                <div className="pricing-price">
                  <span className="pricing-amount">{Number(pkg.gia).toLocaleString('vi-VN')}đ</span>
                  <span className="pricing-period">/ {pkg.so_ngay} ngày</span>
                </div>
                <div className="pricing-posts">
                  {pkg.gioi_han_tin >= 999 ? 'Không giới hạn tin đăng' : `${pkg.gioi_han_tin} tin đăng`}
                </div>
              </div>
              {pkg.mo_ta && (
                <ul className="pricing-features">
                  {pkg.mo_ta.split(',').map(f => (
                    <li key={f} className="pricing-feature included">
                      <span className="pricing-check">✓</span> {f.trim()}
                    </li>
                  ))}
                </ul>
              )}
              <button className={`pricing-buy-btn ${pkg.noi_bat ? 'pricing-buy-gold' : 'pricing-buy-gray'}`}
                onClick={() => handleBuy(pkg)}>
                Mua gói này
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
            <div className={`pricing-modal-plan ${selected.noi_bat ? 'pricing-card-gold' : 'pricing-card-gray'}`}>
              <strong>{selected.ten_goi}</strong>
              <span>{Number(selected.gia).toLocaleString('vi-VN')}đ / {selected.so_ngay} ngày</span>
            </div>

            <div className="pricing-modal-balance">
              <span>Số dư ví của bạn:</span>
              <strong style={{ color: balance >= selected.gia ? '#22c55e' : '#ef4444' }}>
                {balance.toLocaleString('vi-VN')}đ
              </strong>
            </div>

            {balance < selected.gia && (
              <div className="pricing-modal-warn">
                ⚠️ Số dư không đủ. Bạn cần nạp thêm{' '}
                <strong>{(selected.gia - balance).toLocaleString('vi-VN')}đ</strong>.{' '}
                <Link to="/employer/wallet" onClick={() => setShowModal(false)}>Nạp tiền ngay →</Link>
              </div>
            )}

            {error && <p className="pricing-modal-warn">{error}</p>}
            {success && <p className="pricing-modal-success">✅ {success}</p>}

            <div className="pricing-modal-total">
              <span>Tổng thanh toán:</span>
              <strong>{Number(selected.gia).toLocaleString('vi-VN')}đ</strong>
            </div>

            <button
              className="pricing-modal-confirm"
              onClick={handleConfirm}
              disabled={buying || balance < selected.gia}
            >
              {buying ? 'Đang xử lý...' : '✅ Xác nhận thanh toán'}
            </button>
            <p className="pricing-modal-note">
              * Tiền sẽ được trừ từ ví. Gói kích hoạt ngay sau khi thanh toán.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
