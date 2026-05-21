import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import { getMyBookingsApi, cancelBookingApi } from '../../api/bookings';
import { startConversationApi } from '../../api/messages';
import './Bookings.css';

const STATUS_LABEL = {
  pending:   { text: 'Chờ xác nhận', cls: 'pending',   icon: '⏳' },
  confirmed: { text: 'Đã xác nhận',  cls: 'confirmed', icon: '✅' },
  rejected:  { text: 'Bị từ chối',   cls: 'rejected',  icon: '❌' },
  active:    { text: 'Đang thuê',    cls: 'active',    icon: '🏠' },
  ended:     { text: 'Đã kết thúc',  cls: 'ended',     icon: '📝' },
  cancelled: { text: 'Đã hủy',       cls: 'cancelled', icon: '🚫' },
};

const TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'pending',   label: 'Chờ xác nhận' },
  { key: 'active',    label: 'Đang thuê' },
  { key: 'ended',     label: 'Đã kết thúc' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function Bookings({ user, onLogout }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [chatLoading, setChatLoading] = useState(null);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'user') { navigate('/login'); return; }
    load();
  }, [user]);

  const load = () => {
    setLoading(true);
    getMyBookingsApi()
      .then(d => setBookings(d.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy yêu cầu này?')) return;
    setCancelling(id);
    try {
      await cancelBookingApi(id);
      showToast('Đã hủy yêu cầu đặt nhà');
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setCancelling(null);
    }
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  const handleChat = async (b) => {
    setChatLoading(b.ma_dp);
    try {
      const result = await startConversationApi(
        b.ma_chu_tro,
        `Xin chào! Tôi muốn trao đổi về yêu cầu đặt nhà "${b.tieu_de}".`,
        b.ma_phong
      );
      navigate(`/message?conversationId=${result.ma_ctc}`);
    } catch {
      navigate('/message');
    } finally {
      setChatLoading(null);
    }
  };

  const FALLBACK = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';

  return (
    <div className="bk-wrap">
      <UserNavbar user={user} onLogout={onLogout} />

      {toast && (
        <div className={`bk-toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>
      )}

      <div className="bk-container">
        <div className="bk-header">
          <h1>📋 Yêu cầu đặt nhà của tôi</h1>
          <Link to="/search" className="bk-find-btn">🔍 Tìm nhà mới</Link>
        </div>

        <div className="bk-tabs">
          {TABS.map(tab => {
            const count = tab.key === 'all' ? bookings.length : bookings.filter(b => b.trang_thai === tab.key).length;
            return (
              <button
                key={tab.key}
                className={`bk-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count > 0 && <span className="bk-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="bk-loading"><div className="bk-spinner" /><p>Đang tải...</p></div>
        ) : bookings.length === 0 ? (
          <div className="bk-empty">
            <span>📋</span>
            <p>Bạn chưa có yêu cầu đặt nhà nào</p>
            <Link to="/search" className="bk-find-btn">Tìm nhà ngay</Link>
          </div>
        ) : (() => {
          const filtered = bookings.filter(b => activeTab === 'all' || b.trang_thai === activeTab);
          if (filtered.length === 0) return (
            <div className="bk-empty">
              <span>📋</span>
              <p>Không có booking nào trong mục này</p>
            </div>
          );
          return (
          <div className="bk-list">
            {filtered.map(b => {
              const s = STATUS_LABEL[b.trang_thai] || STATUS_LABEL.pending;
              return (
                <div key={b.ma_dp} className="bk-card">
                  <div className="bk-card-img">
                    <img src={b.anh_bia || FALLBACK} alt={b.tieu_de}
                      onError={e => { e.target.src = FALLBACK; }} />
                  </div>
                  <div className="bk-card-body">
                    <div className="bk-card-top">
                      <h3 className="bk-room-title">{b.tieu_de}</h3>
                      <span className={`bk-status ${s.cls}`}>{s.icon} {s.text}</span>
                    </div>
                    <p className="bk-address">📍 {b.dia_chi}, {b.tinh_thanh}</p>
                    <div className="bk-dates">
                      <span>📅 {new Date(b.ngay_bat_dau).toLocaleDateString('vi-VN')} → {new Date(b.ngay_ket_thuc).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="bk-money">
                      <span>💰 {Number(b.tien_thue).toLocaleString('vi-VN')}đ/tháng</span>
                      {b.tien_coc > 0 && <span>🔒 Cọc: {Number(b.tien_coc).toLocaleString('vi-VN')}đ</span>}
                    </div>
                    <p className="bk-landlord">👤 Chủ nhà: {b.ten_chu_tro} · {b.sdt_chu_tro}</p>
                    {b.ghi_chu && <p className="bk-note">💬 {b.ghi_chu}</p>}
                    <div className="bk-actions">
                      {b.ma_hd && (
                        <Link to={`/bookings/${b.ma_dp}/contract`} className="bk-btn-contract">
                          📄 Xem hợp đồng
                        </Link>
                      )}
                      <button
                        className="bk-btn-chat"
                        onClick={() => handleChat(b)}
                        disabled={chatLoading === b.ma_dp}
                      >
                        {chatLoading === b.ma_dp ? '⏳...' : '💬 Nhắn tin'}
                      </button>
                      {b.trang_thai === 'active' && (
                        <Link to={`/maintenance?bookingId=${b.ma_dp}`} className="bk-btn-maintenance">
                          🔧 Báo sự cố
                        </Link>
                      )}
                      {['pending', 'confirmed'].includes(b.trang_thai) && (
                        <button
                          className="bk-btn-cancel"
                          onClick={() => handleCancel(b.ma_dp)}
                          disabled={cancelling === b.ma_dp}
                        >
                          {cancelling === b.ma_dp ? 'Đang hủy...' : '❌ Hủy yêu cầu'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>
    </div>
  );
}
