import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerNavbar from '../../components/EmployerNavbar';
import { getEmployerMaintenanceApi, updateMaintenanceApi } from '../../api/bookings';
import './MaintenanceManage.css';

const MUC_DO = {
  low:    { text: 'Thấp',      cls: 'low',    icon: '🟢' },
  medium: { text: 'Trung bình', cls: 'medium', icon: '🟡' },
  high:   { text: 'Cao',       cls: 'high',   icon: '🟠' },
  urgent: { text: 'Khẩn cấp',  cls: 'urgent', icon: '🔴' },
};
const TRANG_THAI_OPTIONS = [
  { value: 'open',        label: 'Mới gửi' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'resolved',    label: 'Đã giải quyết' },
  { value: 'closed',      label: 'Đóng' },
];

export default function MaintenanceManage({ user, onLogout }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id, trang_thai, phan_hoi }
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'employer') { navigate('/employer'); return; }
    load();
  }, [user, filter]);

  const load = () => {
    setLoading(true);
    getEmployerMaintenanceApi(filter)
      .then(d => setReports(d.reports))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMaintenanceApi(editing.id, { trang_thai: editing.trang_thai, phan_hoi: editing.phan_hoi });
      showToast('Đã cập nhật báo cáo');
      setEditing(null);
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mm-wrap">
      <EmployerNavbar user={user} onLogout={onLogout} />
      {toast && <div className={`mm-toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>}

      <div className="mm-container">
        <h1 className="mm-title">🔧 Quản lý sự cố</h1>

        <div className="mm-filters">
          <button className={`mm-filter-btn ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>Tất cả</button>
          {TRANG_THAI_OPTIONS.map(o => (
            <button key={o.value} className={`mm-filter-btn ${filter === o.value ? 'active' : ''}`}
              onClick={() => setFilter(o.value)}>{o.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="mm-loading"><div className="mm-spinner" /></div>
        ) : reports.length === 0 ? (
          <div className="mm-empty"><span>🔧</span><p>Không có báo cáo nào</p></div>
        ) : (
          <div className="mm-list">
            {reports.map(r => {
              const md = MUC_DO[r.muc_do] || MUC_DO.medium;
              const isEditing = editing?.id === r.ma_bc;
              return (
                <div key={r.ma_bc} className={`mm-card ${r.muc_do === 'urgent' ? 'urgent' : ''}`}>
                  <div className="mm-card-top">
                    <div>
                      <h3>{r.tieu_de}</h3>
                      <p className="mm-room">{r.ten_phong} · {r.dia_chi}</p>
                      <p className="mm-tenant">👤 {r.ten_nguoi_bao} · {r.sdt_nguoi_bao || '—'}</p>
                    </div>
                    <div className="mm-badges">
                      <span className={`mm-badge muc-do-${md.cls}`}>{md.icon} {md.text}</span>
                      <span className={`mm-badge tt-${r.trang_thai}`}>
                        {TRANG_THAI_OPTIONS.find(o => o.value === r.trang_thai)?.label || r.trang_thai}
                      </span>
                    </div>
                  </div>

                  <p className="mm-desc">{r.mo_ta}</p>

                  {isEditing ? (
                    <div className="mm-edit-form">
                      <div className="mm-edit-row">
                        <label>Trạng thái</label>
                        <select value={editing.trang_thai}
                          onChange={e => setEditing(v => ({ ...v, trang_thai: e.target.value }))}>
                          {TRANG_THAI_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mm-edit-row">
                        <label>Phản hồi</label>
                        <textarea value={editing.phan_hoi}
                          onChange={e => setEditing(v => ({ ...v, phan_hoi: e.target.value }))}
                          rows={3} placeholder="Nhập phản hồi cho người thuê..." />
                      </div>
                      <div className="mm-edit-btns">
                        <button className="mm-save-btn" onClick={handleSave} disabled={saving}>
                          {saving ? 'Đang lưu...' : '💾 Lưu'}
                        </button>
                        <button className="mm-cancel-btn" onClick={() => setEditing(null)}>Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {r.phan_hoi && (
                        <div className="mm-reply">
                          <strong>Phản hồi của bạn:</strong>
                          <p>{r.phan_hoi}</p>
                        </div>
                      )}
                      <div className="mm-card-footer">
                        <span className="mm-date">{new Date(r.ngay_tao).toLocaleString('vi-VN')}</span>
                        <button className="mm-respond-btn"
                          onClick={() => setEditing({ id: r.ma_bc, trang_thai: r.trang_thai, phan_hoi: r.phan_hoi || '' })}>
                          ✏️ Xử lý
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
