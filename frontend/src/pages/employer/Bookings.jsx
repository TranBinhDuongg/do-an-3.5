import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployerNavbar from '../../components/EmployerNavbar';
import { getEmployerBookingsApi, respondBookingApi, activateBookingApi, endBookingApi } from '../../api/bookings';
import { startConversationApi } from '../../api/messages';
import './Bookings.css';

const STATUS_LABEL = {
  pending:   { text: 'Chờ xác nhận', cls: 'pending',   icon: '⏳' },
  confirmed: { text: 'Đã xác nhận',  cls: 'confirmed', icon: '✅' },
  rejected:  { text: 'Đã từ chối',   cls: 'rejected',  icon: '❌' },
  active:    { text: 'Đang thuê',    cls: 'active',    icon: '🏠' },
  ended:     { text: 'Đã kết thúc',  cls: 'ended',     icon: '📝' },
  cancelled: { text: 'Đã hủy',       cls: 'cancelled', icon: '🚫' },
};

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending',   label: '⏳ Chờ xác nhận' },
  { value: 'confirmed', label: '✅ Đã xác nhận' },
  { value: 'active',    label: '🏠 Đang thuê' },
  { value: 'ended',     label: '📝 Đã kết thúc' },
];

export default function EmployerBookings({ user, onLogout }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [chatLoading, setChatLoading] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'employer') { navigate('/employer'); return; }
    load();
  }, [user, filter]);

  const load = () => {
    setLoading(true);
    getEmployerBookingsApi(filter)
      .then(d => setBookings(d.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  const handleRespond = async (id, action) => {
    const label = action === 'confirmed' ? 'xác nhận' : 'từ chối';
    if (!window.confirm(`Bạn có chắc muốn ${label} yêu cầu này?`)) return;
    setActionLoading(id);
    try {
      await respondBookingApi(id, action);
      showToast(action === 'confirmed' ? '✅ Đã xác nhận và tạo hợp đồng' : '❌ Đã từ chối');
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Kích hoạt hợp đồng? Nhà sẽ được đánh dấu hết chỗ.')) return;
    setActionLoading(id);
    try {
      await activateBookingApi(id);
      showToast('🏠 Đã kích hoạt hợp đồng');
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnd = async (id) => {
    if (!window.confirm('Kết thúc hợp đồng? Nhà sẽ được mở lại.')) return;
    setActionLoading(id);
    try {
      await endBookingApi(id);
      showToast('📝 Đã kết thúc hợp đồng');
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChat = async (b) => {
    setChatLoading(b.ma_dp);
    try {
      const result = await startConversationApi(
        b.ma_nguoi_thue,
        `Xin chào ${b.ten_nguoi_thue}, tôi muốn trao đổi về yêu cầu đặt nhà "${b.tieu_de}".`,
        b.ma_phong
      );
      navigate(`/message?conversationId=${result.ma_ctc}`);
    } catch {
      navigate('/message');
    } finally {
      setChatLoading(null);
    }
  };

  return (
    <div className="ebk-wrap">
      <EmployerNavbar user={user} onLogout={onLogout} />
      {toast && <div className={`ebk-toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>}

      <div className="ebk-container">
        <h1 className="ebk-title">📋 Quản lý đặt nhà</h1>

        <div className="ebk-filters">
          {FILTERS.map(f => (
            <button key={f.value} className={`ebk-filter-btn ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="ebk-loading"><div className="ebk-spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="ebk-empty"><span>📋</span><p>Không có yêu cầu nào</p></div>
        ) : (
          <div className="ebk-list">
            {bookings.map(b => {
              const s = STATUS_LABEL[b.trang_thai] || STATUS_LABEL.pending;
              const isLoading = actionLoading === b.ma_dp;
              return (
                <div key={b.ma_dp} className="ebk-card">
                  <div className="ebk-card-header">
                    <div>
                      <h3>{b.tieu_de}</h3>
                      <p className="ebk-addr">📍 {b.dia_chi}, {b.tinh_thanh}</p>
                    </div>
                    <span className={`ebk-status ${s.cls}`}>{s.icon} {s.text}</span>
                  </div>

                  <div className="ebk-info-grid">
                    <div><label>Người thuê</label><p>{b.ten_nguoi_thue}</p></div>
                    <div><label>Điện thoại</label><p>{b.sdt_nguoi_thue || '—'}</p></div>
                    <div><label>Email</label><p>{b.email_nguoi_thue}</p></div>
                    <div><label>Thời gian thuê</label>
                      <p>{new Date(b.ngay_bat_dau).toLocaleDateString('vi-VN')} → {new Date(b.ngay_ket_thuc).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div><label>Tiền thuê</label><p className="ebk-price">{Number(b.tien_thue).toLocaleString('vi-VN')}đ/tháng</p></div>
                    <div><label>Tiền cọc</label><p>{Number(b.tien_coc).toLocaleString('vi-VN')}đ</p></div>
                  </div>

                  {b.ghi_chu && <p className="ebk-note">💬 Ghi chú: {b.ghi_chu}</p>}

                  <div className="ebk-actions">
                    {b.ma_hd && (
                      <Link to={`/bookings/${b.ma_dp}/contract`} className="ebk-btn ebk-btn-contract">
                        📄 Hợp đồng
                      </Link>
                    )}
                    <button
                      className="ebk-btn ebk-btn-chat"
                      disabled={chatLoading === b.ma_dp}
                      onClick={() => handleChat(b)}
                    >
                      {chatLoading === b.ma_dp ? '⏳...' : '💬 Nhắn tin'}
                    </button>
                    {b.trang_thai === 'pending' && (
                      <>
                        <button className="ebk-btn ebk-btn-confirm" disabled={isLoading}
                          onClick={() => handleRespond(b.ma_dp, 'confirmed')}>
                          {isLoading ? '...' : '✅ Xác nhận'}
                        </button>
                        <button className="ebk-btn ebk-btn-reject" disabled={isLoading}
                          onClick={() => handleRespond(b.ma_dp, 'rejected')}>
                          {isLoading ? '...' : '❌ Từ chối'}
                        </button>
                      </>
                    )}
                    {b.trang_thai === 'confirmed' && (
                      <button className="ebk-btn ebk-btn-activate" disabled={isLoading}
                        onClick={() => handleActivate(b.ma_dp)}>
                        {isLoading ? '...' : '🏠 Kích hoạt'}
                      </button>
                    )}
                    {b.trang_thai === 'active' && (
                      <button className="ebk-btn ebk-btn-end" disabled={isLoading}
                        onClick={() => handleEnd(b.ma_dp)}>
                        {isLoading ? '...' : '📝 Kết thúc HĐ'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
