import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell';
import './Wallet.css';

const AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

const MOCK_HISTORY = [
  { id: 1, type: 'topup',   desc: 'Nạp tiền qua MoMo',              amount: +500000,  status: 'success', date: '2025-04-28 14:32' },
  { id: 2, type: 'payment', desc: 'Mua gói Tiêu chuẩn (30 ngày)',   amount: -79000,   status: 'success', date: '2025-04-28 14:35' },
  { id: 3, type: 'topup',   desc: 'Nạp tiền qua Chuyển khoản',      amount: +200000,  status: 'success', date: '2025-04-20 09:10' },
  { id: 4, type: 'payment', desc: 'Mua gói Cơ bản (7 ngày)',        amount: -29000,   status: 'success', date: '2025-04-15 11:05' },
  { id: 5, type: 'topup',   desc: 'Nạp tiền qua MoMo',              amount: +100000,  status: 'pending', date: '2025-04-10 16:20' },
  { id: 6, type: 'payment', desc: 'Mua gói Cao cấp (30 ngày)',      amount: -149000,  status: 'success', date: '2025-03-30 08:45' },
];

const METHODS = [
  { id: 'momo',   icon: '💜', label: 'Ví MoMo' },
  { id: 'zalo',   icon: '🔵', label: 'ZaloPay' },
  { id: 'bank',   icon: '🏦', label: 'Chuyển khoản' },
  { id: 'card',   icon: '💳', label: 'Thẻ ATM/Visa' },
];

export default function Wallet({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [amount, setAmount]         = useState(null);
  const [customAmt, setCustomAmt]   = useState('');
  const [method, setMethod]         = useState(null);
  const [step, setStep]             = useState(1); // 1=chọn tiền, 2=chọn pp, 3=xác nhận
  const [filter, setFilter]         = useState('all');

  const balance = MOCK_HISTORY
    .filter(t => t.status === 'success')
    .reduce((s, t) => s + t.amount, 0);

  const finalAmount = amount || (parseInt(customAmt.replace(/\D/g, '')) || 0);

  const filtered = filter === 'all' ? MOCK_HISTORY
    : MOCK_HISTORY.filter(t => t.type === filter);

  const openModal = () => { setStep(1); setAmount(null); setCustomAmt(''); setMethod(null); setShowModal(true); };

  const handleConfirm = () => {
    setShowModal(false);
    // TODO: gọi API nạp tiền
    alert('Yêu cầu nạp tiền đã được gửi! Vui lòng hoàn tất thanh toán.');
  };

  return (
    <div className="wallet-page">
      {/* NAVBAR */}
      <nav className="pricing-nav">
        <div className="pricing-nav-inner">
          <Link to="/employer" className="pricing-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
          <div className="pricing-nav-links">
            <Link to="/employer"           className="pricing-nav-link">Tổng quan</Link>
            <Link to="/employer/rooms"     className="pricing-nav-link">Tin đăng</Link>
            <Link to="/employer/wallet"    className="pricing-nav-link active">Ví của tôi</Link>
            <Link to="/employer/pricing"   className="pricing-nav-link pricing-nav-link-gold">Dịch vụ</Link>
          </div>
          <div className="pricing-nav-right">
            <NotificationBell user={user} />
            <div className="pricing-user-wrap">
              <button className="pricing-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
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
                  <hr className="pricing-drop-hr" />
                  <button className="pricing-drop-logout" onClick={() => { onLogout?.(); navigate('/login'); }}>🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="wallet-body">
        {/* Balance card */}
        <div className="wallet-balance-card">
          <div className="wallet-balance-left">
            <div className="wallet-balance-icon">💰</div>
            <div>
              <p className="wallet-balance-label">Số dư tài khoản</p>
              <p className="wallet-balance-amount">{balance.toLocaleString('vi-VN')}đ</p>
              <p className="wallet-balance-note">Dùng để mua gói đăng tin</p>
            </div>
          </div>
          <button className="wallet-topup-btn" onClick={openModal}>
            + Nạp tiền
          </button>
        </div>

        {/* Stats row */}
        <div className="wallet-stats">
          {[
            { label: 'Tổng đã nạp',    value: MOCK_HISTORY.filter(t=>t.type==='topup'&&t.status==='success').reduce((s,t)=>s+t.amount,0), color: '#22c55e', icon: '⬆️' },
            { label: 'Tổng đã chi',    value: Math.abs(MOCK_HISTORY.filter(t=>t.type==='payment').reduce((s,t)=>s+t.amount,0)), color: '#ef4444', icon: '⬇️' },
            { label: 'Giao dịch',      value: MOCK_HISTORY.length, color: '#2563eb', icon: '📋', isCount: true },
          ].map(s => (
            <div key={s.label} className="wallet-stat-card">
              <span className="wallet-stat-icon">{s.icon}</span>
              <div>
                <p className="wallet-stat-label">{s.label}</p>
                <p className="wallet-stat-value" style={{ color: s.color }}>
                  {s.isCount ? s.value : `${s.value.toLocaleString('vi-VN')}đ`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="wallet-history">
          <div className="wallet-history-header">
            <h2>Lịch sử giao dịch</h2>
            <div className="wallet-filter-tabs">
              {[['all','Tất cả'],['topup','Nạp tiền'],['payment','Thanh toán']].map(([v,l]) => (
                <button key={v} className={`wallet-filter-tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead>
                <tr>
                  <th>Mô tả</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="wallet-empty">Chưa có giao dịch nào</td></tr>
                )}
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="wallet-tx-desc">
                        <span className="wallet-tx-icon">{t.type === 'topup' ? '⬆️' : '⬇️'}</span>
                        <span>{t.desc}</span>
                      </div>
                    </td>
                    <td className="wallet-tx-date">{t.date}</td>
                    <td>
                      <span className={`wallet-status wallet-status-${t.status}`}>
                        {t.status === 'success' ? 'Thành công' : t.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                      </span>
                    </td>
                    <td className={`wallet-tx-amount ${t.amount > 0 ? 'plus' : 'minus'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TOPUP MODAL */}
      {showModal && (
        <div className="pricing-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pricing-modal wallet-modal" onClick={e => e.stopPropagation()}>
            <button className="pricing-modal-close" onClick={() => setShowModal(false)}>✕</button>

            {/* Step indicator */}
            <div className="wallet-steps">
              {['Chọn số tiền','Phương thức','Xác nhận'].map((s, i) => (
                <div key={s} className={`wallet-step ${step > i+1 ? 'done' : step === i+1 ? 'active' : ''}`}>
                  <div className="wallet-step-dot">{step > i+1 ? '✓' : i+1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Step 1: chọn số tiền */}
            {step === 1 && (
              <>
                <h2>Chọn số tiền nạp</h2>
                <div className="wallet-amount-grid">
                  {AMOUNTS.map(a => (
                    <button
                      key={a}
                      className={`wallet-amount-btn ${amount === a ? 'selected' : ''}`}
                      onClick={() => { setAmount(a); setCustomAmt(''); }}
                    >
                      {a.toLocaleString('vi-VN')}đ
                    </button>
                  ))}
                </div>
                <div className="wallet-custom-wrap">
                  <label>Hoặc nhập số tiền khác:</label>
                  <input
                    type="text"
                    className="wallet-custom-input"
                    placeholder="Nhập số tiền..."
                    value={customAmt}
                    onChange={e => { setCustomAmt(e.target.value); setAmount(null); }}
                  />
                </div>
                <button
                  className="pricing-modal-confirm"
                  disabled={!finalAmount || finalAmount < 10000}
                  onClick={() => setStep(2)}
                >
                  Tiếp theo →
                </button>
                {finalAmount > 0 && finalAmount < 10000 && (
                  <p className="wallet-warn">Số tiền tối thiểu là 10.000đ</p>
                )}
              </>
            )}

            {/* Step 2: chọn phương thức */}
            {step === 2 && (
              <>
                <h2>Phương thức thanh toán</h2>
                <p className="wallet-step2-amt">Số tiền nạp: <strong>{finalAmount.toLocaleString('vi-VN')}đ</strong></p>
                <div className="wallet-method-grid">
                  {METHODS.map(m => (
                    <button
                      key={m.id}
                      className={`wallet-method-btn ${method === m.id ? 'selected' : ''}`}
                      onClick={() => setMethod(m.id)}
                    >
                      <span className="wallet-method-icon">{m.icon}</span>
                      <span>{m.label}</span>
                      {method === m.id && <span className="wallet-method-check">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="wallet-modal-btns">
                  <button className="wallet-back-btn" onClick={() => setStep(1)}>← Quay lại</button>
                  <button className="pricing-modal-confirm wallet-next-btn" disabled={!method} onClick={() => setStep(3)}>
                    Tiếp theo →
                  </button>
                </div>
              </>
            )}

            {/* Step 3: xác nhận */}
            {step === 3 && (
              <>
                <h2>Xác nhận nạp tiền</h2>
                <div className="wallet-confirm-box">
                  <div className="wallet-confirm-row">
                    <span>Số tiền nạp</span>
                    <strong>{finalAmount.toLocaleString('vi-VN')}đ</strong>
                  </div>
                  <div className="wallet-confirm-row">
                    <span>Phương thức</span>
                    <strong>{METHODS.find(m => m.id === method)?.icon} {METHODS.find(m => m.id === method)?.label}</strong>
                  </div>
                  <div className="wallet-confirm-row">
                    <span>Số dư sau nạp</span>
                    <strong className="wallet-confirm-new">{(balance + finalAmount).toLocaleString('vi-VN')}đ</strong>
                  </div>
                </div>
                <div className="wallet-modal-btns">
                  <button className="wallet-back-btn" onClick={() => setStep(2)}>← Quay lại</button>
                  <button className="pricing-modal-confirm wallet-next-btn" onClick={handleConfirm}>
                    ✅ Xác nhận nạp tiền
                  </button>
                </div>
                <p className="pricing-modal-note">* Tiền sẽ được cộng vào tài khoản sau khi thanh toán thành công</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
