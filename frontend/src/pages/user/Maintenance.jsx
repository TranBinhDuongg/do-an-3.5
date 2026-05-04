import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserNavbar from '../../components/UserNavbar';
import { getMyMaintenanceApi, createMaintenanceApi } from '../../api/bookings';
import { getMyBookingsApi } from '../../api/bookings';
import './Maintenance.css';

const MUC_DO = {
  low:    { text: 'Thấp',    cls: 'low',    icon: '🟢' },
  medium: { text: 'Trung bình', cls: 'medium', icon: '🟡' },
  high:   { text: 'Cao',     cls: 'high',   icon: '🟠' },
  urgent: { text: 'Khẩn cấp', cls: 'urgent', icon: '🔴' },
};
const TRANG_THAI = {
  open:        { text: 'Mới gửi',      cls: 'open'        },
  in_progress: { text: 'Đang xử lý',  cls: 'in_progress' },
  resolved:    { text: 'Đã giải quyết', cls: 'resolved'  },
  closed:      { text: 'Đã đóng',      cls: 'closed'      },
};

export default function Maintenance({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultBookingId = searchParams.get('bookingId') || '';

  const [reports, setReports] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!defaultBookingId);
  const [form, setForm] = useState({ ma_hd: '', tieu_de: '', mo_ta: '', muc_do: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'user') { navigate('/login'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, bRes] = await Promise.all([getMyMaintenanceApi(), getMyBookingsApi()]);
      setReports(rRes.reports);
      const active = bRes.bookings.filter(b => b.trang_thai === 'active' && b.ma_hd);
      setActiveBookings(active);
      // Nếu có bookingId từ URL, tìm ma_hd tương ứng
      if (defaultBookingId) {
        const found = active.find(b => String(b.ma_dp) === defaultBookingId);
        if (found) setForm(f => ({ ...f, ma_hd: found.ma_hd }));
      }
    } catch {}
    setLoading(false);
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ma_hd) return showToast('Vui lòng chọn hợp đồng', true);
    setSubmitting(true);
    try {
      await createMaintenanceApi(form);
      showToast('Đã gửi báo cáo sự cố');
      setShowForm(false);
      setForm({ ma_hd: '', tieu_de: '', mo_ta: '', muc_do: 'medium' });
      loadData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-wrap">
      <UserNavbar user={user} onLogout={onLogout} />
      {toast && <div className={`mt-toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>}

      <div className="mt-container">
        <div className="mt-header">
          <h1>🔧 Báo cáo sự cố</h1>
          {activeBookings.length > 0 && (
            <button className="mt-new-btn" onClick={() => setShowForm(v => !v)}>
              {showForm ? '✕ Đóng' : '+ Báo cáo mới'}
            </button>
          )}
        </div>

        {showForm && (
          <div className="mt-form-card">
            <h3>Gửi báo cáo sự cố</h3>
            <form onSubmit={handleSubmit}>
              <div className="mt-field">
                <label>Hợp đồng *</label>
                <select value={form.ma_hd} onChange={e => setForm(f => ({ ...f, ma_hd: e.target.value }))} required>
                  <option value="">-- Chọn nhà đang thuê --</option>
                  {activeBookings.map(b => (
                    <option key={b.ma_hd} value={b.ma_hd}>{b.tieu_de} - {b.tinh_thanh}</option>
                  ))}
                </select>
              </div>
              <div className="mt-field">
                <label>Tiêu đề *</label>
                <input type="text" value={form.tieu_de} onChange={e => setForm(f => ({ ...f, tieu_de: e.target.value }))}
                  placeholder="VD: Điều hòa bị hỏng, Vòi nước rò rỉ..." required maxLength={200} />
              </div>
              <div className="mt-field">
                <label>Mô tả chi tiết *</label>
                <textarea value={form.mo_ta} onChange={e => setForm(f => ({ ...f, mo_ta: e.target.value }))}
                  placeholder="Mô tả chi tiết vấn đề..." rows={4} required />
              </div>
              <div className="mt-field">
                <label>Mức độ</label>
                <div className="mt-muc-do-group">
                  {Object.entries(MUC_DO).map(([k, v]) => (
                    <button key={k} type="button"
                      className={`mt-muc-do-btn ${form.muc_do === k ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, muc_do: k }))}>
                      {v.icon} {v.text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-form-btns">
                <button type="submit" className="mt-submit-btn" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : '📤 Gửi báo cáo'}
                </button>
                <button type="button" className="mt-cancel-btn" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        )}

        {activeBookings.length === 0 && !loading && (
          <div className="mt-info">ℹ️ Bạn cần có hợp đồng đang hiệu lực để báo cáo sự cố.</div>
        )}

        {loading ? (
          <div className="mt-loading"><div className="mt-spinner" /></div>
        ) : reports.length === 0 ? (
          <div className="mt-empty"><span>🔧</span><p>Chưa có báo cáo sự cố nào</p></div>
        ) : (
          <div className="mt-list">
            {reports.map(r => {
              const md = MUC_DO[r.muc_do] || MUC_DO.medium;
              const tt = TRANG_THAI[r.trang_thai] || TRANG_THAI.open;
              return (
                <div key={r.ma_bc} className="mt-card">
                  <div className="mt-card-top">
                    <div>
                      <h3>{r.tieu_de}</h3>
                      <p className="mt-room">{r.ten_phong} · {r.dia_chi}</p>
                    </div>
                    <div className="mt-badges">
                      <span className={`mt-badge muc-do-${md.cls}`}>{md.icon} {md.text}</span>
                      <span className={`mt-badge tt-${tt.cls}`}>{tt.text}</span>
                    </div>
                  </div>
                  <p className="mt-desc">{r.mo_ta}</p>
                  {r.phan_hoi && (
                    <div className="mt-reply">
                      <strong>💬 Phản hồi từ chủ nhà:</strong>
                      <p>{r.phan_hoi}</p>
                    </div>
                  )}
                  <p className="mt-date">Gửi lúc: {new Date(r.ngay_tao).toLocaleString('vi-VN')}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
