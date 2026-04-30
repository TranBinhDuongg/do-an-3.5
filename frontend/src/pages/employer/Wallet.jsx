import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell';
import { getBalanceApi, getTransactionsApi, topupApi } from '../../api/wallet';
import './Wallet.css';

const AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const METHODS = [
  { id: 'bank', icon: '🏦', label: 'Chuyển khoản ngân hàng' },
  { id: 'momo', icon: '💜', label: 'Ví MoMo' },
  { id: 'zalo', icon: '🔵', label: 'ZaloPay' },
  { id: 'card', icon: '💳', label: 'Thẻ ATM/Visa' },
];

export default function Wallet({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [amount, setAmount]             = useState(null);
  const [customAmt, setCustomAmt]       = useState('');
  const [method, setMethod]             = useState(null);
  const [step, setStep]                 = useState(1);
  const [filter, setFilter]             = useState('all');
  const [balance, setBalance]           = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [bankInfo, setBankInfo]         = useState(null);
  const [error, setError]               = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [balRes, txRes] = await Promise.all([getBalanceApi(), getTransactionsApi()]);
      setBalance(balRes.so_du);
      setTransactions(txRes.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const finalAmount = amount || (parseInt(customAmt.replace(/\D/g, '')) || 0);
  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
  const totalTopup = transactions.filter(t => t.type === 'topup' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === 'payment' && t.status === 'success').reduce((s, t) => s + Math.abs(t.amount), 0);

  const openModal = () => {
    setStep(1); setAmount(null); setCustomAmt('');
    setMethod(null); setBankInfo(null); setError('');
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!finalAmount || !method) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await topupApi(finalAmount, method);
      setBankInfo(res.bank_info);
      setStep(4);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wallet-page">
      <nav className="pricing-nav">
        <div className="pricing-nav-inner">
          <Link to="/employer" className="pricing-nav-logo">🏠 PhongTro<span>VN</span></Link>
          <div className="pricing-nav-links">
            <Link to="/employer"         className="pricing-nav-link">Tong quan</Link>
            <Link to="/employer/rooms"   className="pricing-nav-link">Tin dang</Link>
            <Link to="/employer/wallet"  className="pricing-nav-link active">Vi cua toi</Link>
            <Link to="/employer/pricing" className="pricing-nav-link pricing-nav-link-gold">Dich vu</Link>
          </div>
          <div className="pricing-nav-right">
            <NotificationBell user={user} />
            <div className="pricing-user-wrap">
              <button className="pricing-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="pricing-avatar">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="avatar" /> : (user?.name?.charAt(0) || 'C')}
                </div>
                <div className="emp-user-info">
                  <span className="emp-user-name">{user?.name || 'Chu tro'}</span>
                  <span className="emp-user-role">Chu tro</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="pricing-dropdown">
                  <Link to="/profile" className="pricing-drop-item" onClick={() => setMenuOpen(false)}>👤 Ho so</Link>
                  <hr className="pricing-drop-hr" />
                  <button className="pricing-drop-logout" onClick={() => { onLogout?.(); navigate('/login'); }}>🚪 Dang xuat</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="wallet-body">
        {loading ? (
          <div className="wallet-loading">Dang tai...</div>
        ) : (
          <>
            <div className="wallet-balance-card">
              <div className="wallet-balance-left">
                <div className="wallet-balance-icon">💰</div>
                <div>
                  <p className="wallet-balance-label">So du tai khoan</p>
                  <p className="wallet-balance-amount">{balance.toLocaleString('vi-VN')}d</p>
                  <p className="wallet-balance-note">Dung de mua goi dang tin</p>
                </div>
              </div>
              <div className="wallet-balance-actions">
                <button className="wallet-topup-btn" onClick={openModal}>+ Nap tien</button>
                <Link to="/employer/pricing" className="wallet-buy-btn">🛒 Mua goi</Link>
              </div>
            </div>

            <div className="wallet-stats">
              {[
                { label: 'Tong da nap', value: totalTopup, color: '#22c55e', icon: '⬆️' },
                { label: 'Tong da chi', value: totalSpent, color: '#ef4444', icon: '⬇️' },
                { label: 'Giao dich',   value: transactions.length, color: '#2563eb', icon: '📋', isCount: true },
              ].map(s => (
                <div key={s.label} className="wallet-stat-card">
                  <span className="wallet-stat-icon">{s.icon}</span>
                  <div>
                    <p className="wallet-stat-label">{s.label}</p>
                    <p className="wallet-stat-value" style={{ color: s.color }}>
                      {s.isCount ? s.value : s.value.toLocaleString('vi-VN') + 'd'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="wallet-history">
              <div className="wallet-history-header">
                <h2>Lich su giao dich</h2>
                <div className="wallet-filter-tabs">
                  {[['all','Tat ca'],['topup','Nap tien'],['payment','Thanh toan']].map(([v,l]) => (
                    <button key={v} className={`wallet-filter-tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="wallet-table-wrap">
                <table className="wallet-table">
                  <thead>
                    <tr><th>Mo ta</th><th>Ngay</th><th>Trang thai</th><th>So tien</th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} className="wallet-empty">Chua co giao dich nao</td></tr>
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
                            {t.status === 'success' ? 'Thanh cong' : t.status === 'pending' ? 'Cho xu ly' : 'That bai'}
                          </span>
                        </td>
                        <td className={`wallet-tx-amount ${t.amount > 0 ? 'plus' : 'minus'}`}>
                          {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('vi-VN')}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="pricing-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pricing-modal wallet-modal" onClick={e => e.stopPropagation()}>
            <button className="pricing-modal-close" onClick={() => setShowModal(false)}>x</button>

            {step < 4 && (
              <div className="wallet-steps">
                {['Chon so tien','Phuong thuc','Xac nhan'].map((s, i) => (
                  <div key={s} className={`wallet-step ${step > i+1 ? 'done' : step === i+1 ? 'active' : ''}`}>
                    <div className="wallet-step-dot">{step > i+1 ? 'v' : i+1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <>
                <h2>Chon so tien nap</h2>
                <div className="wallet-amount-grid">
                  {AMOUNTS.map(a => (
                    <button key={a} className={`wallet-amount-btn ${amount === a ? 'selected' : ''}`}
                      onClick={() => { setAmount(a); setCustomAmt(''); }}>
                      {a.toLocaleString('vi-VN')}d
                    </button>
                  ))}
                </div>
                <div className="wallet-custom-wrap">
                  <label>Hoac nhap so tien khac:</label>
                  <input type="text" className="wallet-custom-input" placeholder="Nhap so tien..."
                    value={customAmt} onChange={e => { setCustomAmt(e.target.value); setAmount(null); }} />
                </div>
                <button className="pricing-modal-confirm" disabled={!finalAmount || finalAmount < 10000} onClick={() => setStep(2)}>
                  Tiep theo
                </button>
                {finalAmount > 0 && finalAmount < 10000 && <p className="wallet-warn">So tien toi thieu la 10.000d</p>}
              </>
            )}

            {step === 2 && (
              <>
                <h2>Phuong thuc thanh toan</h2>
                <p className="wallet-step2-amt">So tien nap: <strong>{finalAmount.toLocaleString('vi-VN')}d</strong></p>
                <div className="wallet-method-grid">
                  {METHODS.map(m => (
                    <button key={m.id} className={`wallet-method-btn ${method === m.id ? 'selected' : ''}`} onClick={() => setMethod(m.id)}>
                      <span className="wallet-method-icon">{m.icon}</span>
                      <span>{m.label}</span>
                      {method === m.id && <span className="wallet-method-check">v</span>}
                    </button>
                  ))}
                </div>
                <div className="wallet-modal-btns">
                  <button className="wallet-back-btn" onClick={() => setStep(1)}>Quay lai</button>
                  <button className="pricing-modal-confirm wallet-next-btn" disabled={!method} onClick={() => setStep(3)}>Tiep theo</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2>Xac nhan nap tien</h2>
                <div className="wallet-confirm-box">
                  <div className="wallet-confirm-row">
                    <span>So tien nap</span>
                    <strong>{finalAmount.toLocaleString('vi-VN')}d</strong>
                  </div>
                  <div className="wallet-confirm-row">
                    <span>Phuong thuc</span>
                    <strong>{METHODS.find(m => m.id === method)?.icon} {METHODS.find(m => m.id === method)?.label}</strong>
                  </div>
                </div>
                {error && <p className="wallet-warn">{error}</p>}
                <div className="wallet-modal-btns">
                  <button className="wallet-back-btn" onClick={() => setStep(2)}>Quay lai</button>
                  <button className="pricing-modal-confirm wallet-next-btn" onClick={handleConfirm} disabled={submitting}>
                    {submitting ? 'Dang xu ly...' : 'Xac nhan nap tien'}
                  </button>
                </div>
                <p className="pricing-modal-note">Tien se duoc cong vao tai khoan sau khi admin xac nhan</p>
              </>
            )}

            {step === 4 && bankInfo && (
              <>
                <h2>Yeu cau da duoc ghi nhan</h2>
                <p className="wallet-step2-amt">Vui long chuyen khoan theo thong tin ben duoi:</p>
                <div className="wallet-bank-info">
                  <div className="wallet-bank-row"><span>Ngan hang</span><strong>{bankInfo.bank}</strong></div>
                  <div className="wallet-bank-row"><span>So tai khoan</span><strong>{bankInfo.account}</strong></div>
                  <div className="wallet-bank-row"><span>Chu tai khoan</span><strong>{bankInfo.name}</strong></div>
                  <div className="wallet-bank-row"><span>So tien</span><strong style={{color:'#22c55e'}}>{bankInfo.amount.toLocaleString('vi-VN')}d</strong></div>
                  <div className="wallet-bank-row"><span>Noi dung CK</span><strong style={{color:'#2563eb'}}>{bankInfo.content}</strong></div>
                </div>
                <p className="pricing-modal-note">Admin se xac nhan trong vong 15-30 phut</p>
                <button className="pricing-modal-confirm" onClick={() => setShowModal(false)}>Dong</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
