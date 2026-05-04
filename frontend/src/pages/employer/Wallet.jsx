import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import EmployerNavbar from '../../components/EmployerNavbar';
import { getBalanceApi, getTransactionsApi, getTransactionsSummaryApi, topupApi } from '../../api/wallet';
import './Wallet.css';

const AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const METHODS = [
  { id: 'bank', icon: '🏦', label: 'Chuyển khoản ngân hàng' },
  { id: 'momo', icon: '💜', label: 'Ví MoMo' },
  { id: 'zalo', icon: '🔵', label: 'ZaloPay' },
  { id: 'card', icon: '💳', label: 'Thẻ ATM/Visa' },
];
const TYPE_FILTERS = [
  { value: 'all',     label: 'Tất cả' },
  { value: 'topup',   label: 'Nạp tiền' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'refund',  label: 'Hoàn tiền' },
];
const PAGE_SIZE = 10;

const TYPE_LABEL = { topup: 'Nạp tiền', payment: 'Thanh toán', refund: 'Hoàn tiền' };
const TYPE_ICON  = { topup: '⬆️', payment: '⬇️', refund: '↩️' };
const METHOD_LABEL = { bank: 'Ngân hàng', momo: 'MoMo', zalo: 'ZaloPay', card: 'Thẻ ATM/Visa', wallet: 'Ví' };

function fmt(n) { return Number(n).toLocaleString('vi-VN') + 'đ'; }

export default function Wallet({ user, onLogout }) {
  // Balance & summary
  const [balance, setBalance]     = useState(0);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Transaction list
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [txLoading, setTxLoading]       = useState(false);

  // Filters
  const [filter, setFilter]     = useState('all');
  const [tuNgay, setTuNgay]     = useState('');
  const [denNgay, setDenNgay]   = useState('');
  const [page, setPage]         = useState(1);

  // Detail modal
  const [detail, setDetail] = useState(null);

  // Topup modal
  const [showModal, setShowModal]   = useState(false);
  const [amount, setAmount]         = useState(null);
  const [customAmt, setCustomAmt]   = useState('');
  const [method, setMethod]         = useState(null);
  const [step, setStep]             = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [bankInfo, setBankInfo]     = useState(null);
  const [modalError, setModalError] = useState('');

  const fetchBalance = useCallback(async () => {
    const balRes = await getBalanceApi();
    setBalance(balRes.so_du);
    // summary riêng, không block nếu lỗi
    try {
      const sumRes = await getTransactionsSummaryApi();
      setSummary(sumRes);
    } catch {
      setSummary({ tong_nap: 0, tong_chi: 0, tong_hoan: 0, tong_gd: 0, cho_xu_ly: 0 });
    }
  }, []);

  const fetchTransactions = useCallback(async (pg = 1) => {
    setTxLoading(true);
    try {
      const res = await getTransactionsApi({
        loai:     filter === 'all' ? undefined : filter,
        tu_ngay:  tuNgay  || undefined,
        den_ngay: denNgay || undefined,
        trang:    pg,
        gioi_han: PAGE_SIZE,
      });
      setTransactions(res.transactions);
      setTotalCount(res.tong_so);
    } finally {
      setTxLoading(false);
    }
  }, [filter, tuNgay, denNgay]);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([fetchBalance(), fetchTransactions(1)]);
      } catch (err) {
        console.error('Wallet init error:', err);
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  // Re-fetch when filters change (skip on mount)
  const isMount = useState(true);
  useEffect(() => {
    if (isMount[0]) { isMount[0] = false; return; }
    setPage(1);
    fetchTransactions(1);
  }, [filter, tuNgay, denNgay]); // eslint-disable-line

  const handlePageChange = (pg) => {
    setPage(pg);
    fetchTransactions(pg);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Export CSV
  const exportCSV = () => {
    const header = ['Mã GD', 'Loại', 'Mô tả', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày'];
    const rows = transactions.map(t => [
      t.id, TYPE_LABEL[t.type] || t.type, `"${t.desc}"`,
      t.amount, METHOD_LABEL[t.method] || t.method || '',
      t.status === 'success' ? 'Thành công' : t.status === 'pending' ? 'Chờ xử lý' : 'Thất bại',
      t.date,
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'lich_su_giao_dich.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Topup modal
  const finalAmount = amount || (parseInt(customAmt.replace(/\D/g, '')) || 0);

  const openModal = () => {
    setStep(1); setAmount(null); setCustomAmt('');
    setMethod(null); setBankInfo(null); setModalError('');
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!finalAmount || !method) return;
    setSubmitting(true); setModalError('');
    try {
      const res = await topupApi(finalAmount, method);
      setBankInfo(res.bank_info);
      setStep(4);
      await fetchBalance();
      fetchTransactions(1); setPage(1);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statsCards = summary ? [
    { label: 'Tổng đã nạp',  value: fmt(summary.tong_nap),  color: '#22c55e', icon: '⬆️' },
    { label: 'Tổng đã chi',  value: fmt(summary.tong_chi),  color: '#ef4444', icon: '⬇️' },
    { label: 'Hoàn tiền',    value: fmt(summary.tong_hoan), color: '#f59e0b', icon: '↩️' },
    { label: 'Tổng GD',      value: summary.tong_gd,        color: '#2563eb', icon: '📋' },
    { label: 'Chờ xử lý',   value: summary.cho_xu_ly,      color: '#f59e0b', icon: '⏳' },
  ] : [];

  return (
    <div className="wallet-page">
      <EmployerNavbar user={user} onLogout={onLogout} />

      <div className="wallet-body">
        {loading ? (
          <div className="wallet-loading">Đang tải...</div>
        ) : error ? (
          <div className="wallet-loading" style={{ color: '#ef4444' }}>⚠️ {error}</div>
        ) : (
          <>
            {/* Balance card */}
            <div className="wallet-balance-card">
              <div className="wallet-balance-left">
                <div className="wallet-balance-icon">💰</div>
                <div>
                  <p className="wallet-balance-label">Số dư tài khoản</p>
                  <p className="wallet-balance-amount">{fmt(balance)}</p>
                  <p className="wallet-balance-note">Dùng để mua gói đăng tin</p>
                </div>
              </div>
              <div className="wallet-balance-actions">
                <button className="wallet-topup-btn" onClick={openModal}>+ Nạp tiền</button>
                <Link to="/employer/pricing" className="wallet-buy-btn">🛒 Mua gói</Link>
              </div>
            </div>

            {/* Stats */}
            <div className="wallet-stats">
              {statsCards.map(s => (
                <div key={s.label} className="wallet-stat-card">
                  <span className="wallet-stat-icon">{s.icon}</span>
                  <div>
                    <p className="wallet-stat-label">{s.label}</p>
                    <p className="wallet-stat-value" style={{ color: s.color }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="wallet-history">
              <div className="wallet-history-header">
                <h2>Lịch sử giao dịch</h2>
                <button className="wallet-export-btn" onClick={exportCSV} title="Xuất CSV">
                  ⬇ Xuất CSV
                </button>
              </div>

              {/* Filters */}
              <div className="wallet-filters">
                <div className="wallet-filter-tabs">
                  {TYPE_FILTERS.map(({ value, label }) => (
                    <button key={value}
                      className={`wallet-filter-tab ${filter === value ? 'active' : ''}`}
                      onClick={() => setFilter(value)}>{label}</button>
                  ))}
                </div>
                <div className="wallet-date-filters">
                  <label>Từ ngày</label>
                  <input type="date" value={tuNgay}  onChange={e => setTuNgay(e.target.value)} />
                  <label>Đến ngày</label>
                  <input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)} />
                  {(tuNgay || denNgay) && (
                    <button className="wallet-clear-date" onClick={() => { setTuNgay(''); setDenNgay(''); }}>✕ Xóa</button>
                  )}
                </div>
              </div>

              <div className="wallet-table-wrap">
                {txLoading ? (
                  <div className="wallet-loading" style={{ padding: '32px' }}>Đang tải...</div>
                ) : (
                  <table className="wallet-table">
                    <thead>
                      <tr><th>Mô tả</th><th>Ngày</th><th>Phương thức</th><th>Trạng thái</th><th>Số tiền</th></tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 && (
                        <tr><td colSpan={5} className="wallet-empty">Chưa có giao dịch nào</td></tr>
                      )}
                      {transactions.map(t => (
                        <tr key={t.id} className="wallet-tx-row" onClick={() => setDetail(t)}>
                          <td>
                            <div className="wallet-tx-desc">
                              <span className="wallet-tx-icon">{TYPE_ICON[t.type] || '💳'}</span>
                              <div>
                                <span className="wallet-tx-name">{t.desc}</span>
                                <span className="wallet-tx-type-badge wallet-tx-type-badge--{t.type}">{TYPE_LABEL[t.type] || t.type}</span>
                              </div>
                            </div>
                          </td>
                          <td className="wallet-tx-date">{t.date}</td>
                          <td className="wallet-tx-method">{METHOD_LABEL[t.method] || t.method || '—'}</td>
                          <td>
                            <span className={`wallet-status wallet-status-${t.status}`}>
                              {t.status === 'success' ? 'Thành công' : t.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                            </span>
                          </td>
                          <td className={`wallet-tx-amount ${t.amount > 0 ? 'plus' : 'minus'}`}>
                            {t.amount > 0 ? '+' : ''}{fmt(Math.abs(t.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="wallet-pagination">
                  <span className="wallet-page-info">
                    Trang {page}/{totalPages} · {totalCount} giao dịch
                  </span>
                  <div className="wallet-page-btns">
                    <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) => p === '...'
                        ? <span key={`e${i}`} className="wallet-page-ellipsis">…</span>
                        : <button key={p} className={page === p ? 'active' : ''} onClick={() => handlePageChange(p)}>{p}</button>
                      )}
                    <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>›</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="pricing-modal-overlay" onClick={() => setDetail(null)}>
          <div className="pricing-modal wallet-modal wallet-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="pricing-modal-close" onClick={() => setDetail(null)}>✕</button>
            <h2>Chi tiết giao dịch</h2>
            <div className="wallet-detail-icon">{TYPE_ICON[detail.type] || '💳'}</div>
            <div className="wallet-confirm-box">
              {[
                ['Mã giao dịch', `#${detail.id}`],
                ['Loại', TYPE_LABEL[detail.type] || detail.type],
                ['Mô tả', detail.desc],
                ['Số tiền', <span style={{ color: detail.amount > 0 ? '#22c55e' : '#ef4444', fontWeight: 800 }}>
                  {detail.amount > 0 ? '+' : ''}{fmt(Math.abs(detail.amount))}
                </span>],
                ['Phương thức', METHOD_LABEL[detail.method] || detail.method || '—'],
                ['Trạng thái', <span className={`wallet-status wallet-status-${detail.status}`}>
                  {detail.status === 'success' ? 'Thành công' : detail.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                </span>],
                ['Mã tham chiếu', detail.ref || '—'],
                ['Ngày tạo', detail.date],
              ].map(([label, val]) => (
                <div key={label} className="wallet-confirm-row">
                  <span>{label}</span><strong>{val}</strong>
                </div>
              ))}
            </div>
            <button className="pricing-modal-confirm" onClick={() => setDetail(null)}>Đóng</button>
          </div>
        </div>
      )}

      {/* Topup modal */}
      {showModal && (
        <div className="pricing-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pricing-modal wallet-modal" onClick={e => e.stopPropagation()}>
            <button className="pricing-modal-close" onClick={() => setShowModal(false)}>✕</button>

            {step < 4 && (
              <div className="wallet-steps">
                {['Chọn số tiền', 'Phương thức', 'Xác nhận'].map((s, i) => (
                  <div key={s} className={`wallet-step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
                    <div className="wallet-step-dot">{step > i + 1 ? '✓' : i + 1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <>
                <h2>Chọn số tiền nạp</h2>
                <div className="wallet-amount-grid">
                  {AMOUNTS.map(a => (
                    <button key={a} className={`wallet-amount-btn ${amount === a ? 'selected' : ''}`}
                      onClick={() => { setAmount(a); setCustomAmt(''); }}>
                      {a.toLocaleString('vi-VN')}đ
                    </button>
                  ))}
                </div>
                <div className="wallet-custom-wrap">
                  <label>Hoặc nhập số tiền khác:</label>
                  <input type="text" className="wallet-custom-input" placeholder="Nhập số tiền..."
                    value={customAmt} onChange={e => { setCustomAmt(e.target.value); setAmount(null); }} />
                </div>
                <button className="pricing-modal-confirm" disabled={!finalAmount || finalAmount < 10000} onClick={() => setStep(2)}>
                  Tiếp theo →
                </button>
                {finalAmount > 0 && finalAmount < 10000 && <p className="wallet-warn">Số tiền tối thiểu là 10.000đ</p>}
              </>
            )}

            {step === 2 && (
              <>
                <h2>Phương thức thanh toán</h2>
                <p className="wallet-step2-amt">Số tiền nạp: <strong>{finalAmount.toLocaleString('vi-VN')}đ</strong></p>
                <div className="wallet-method-grid">
                  {METHODS.map(m => (
                    <button key={m.id} className={`wallet-method-btn ${method === m.id ? 'selected' : ''}`} onClick={() => setMethod(m.id)}>
                      <span className="wallet-method-icon">{m.icon}</span>
                      <span>{m.label}</span>
                      {method === m.id && <span className="wallet-method-check">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="wallet-modal-btns">
                  <button className="wallet-back-btn" onClick={() => setStep(1)}>← Quay lại</button>
                  <button className="pricing-modal-confirm wallet-next-btn" disabled={!method} onClick={() => setStep(3)}>Tiếp theo →</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2>Xác nhận nạp tiền</h2>
                <div className="wallet-confirm-box">
                  <div className="wallet-confirm-row"><span>Số tiền nạp</span><strong>{finalAmount.toLocaleString('vi-VN')}đ</strong></div>
                  <div className="wallet-confirm-row">
                    <span>Phương thức</span>
                    <strong>{METHODS.find(m => m.id === method)?.icon} {METHODS.find(m => m.id === method)?.label}</strong>
                  </div>
                </div>
                {modalError && <p className="wallet-warn">{modalError}</p>}
                <div className="wallet-modal-btns">
                  <button className="wallet-back-btn" onClick={() => setStep(2)}>← Quay lại</button>
                  <button className="pricing-modal-confirm wallet-next-btn" onClick={handleConfirm} disabled={submitting}>
                    {submitting ? 'Đang xử lý...' : '✅ Xác nhận nạp tiền'}
                  </button>
                </div>
                <p className="pricing-modal-note">* Tiền sẽ được cộng vào tài khoản sau khi admin xác nhận</p>
              </>
            )}

            {step === 4 && bankInfo && (
              <>
                <h2>✅ Yêu cầu đã được ghi nhận</h2>
                <p className="wallet-step2-amt">Vui lòng chuyển khoản theo thông tin bên dưới:</p>
                <div className="wallet-bank-info">
                  {[
                    ['Ngân hàng', bankInfo.bank],
                    ['Số tài khoản', bankInfo.account],
                    ['Chủ tài khoản', bankInfo.name],
                    ['Số tiền', <span style={{ color: '#22c55e' }}>{bankInfo.amount.toLocaleString('vi-VN')}đ</span>],
                    ['Nội dung CK', <span style={{ color: '#2563eb' }}>{bankInfo.content}</span>],
                  ].map(([label, val]) => (
                    <div key={label} className="wallet-bank-row"><span>{label}</span><strong>{val}</strong></div>
                  ))}
                </div>
                <p className="pricing-modal-note">* Admin sẽ xác nhận trong vòng 15-30 phút</p>
                <button className="pricing-modal-confirm" onClick={() => setShowModal(false)}>Đóng</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
