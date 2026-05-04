import { useState, useEffect, useCallback } from 'react';
import { adminGetTopupsApi, adminApproveTopupApi, adminRejectTopupApi, adminGetRevenueApi } from '../../api/wallet';
import AdminLayout from '../../components/AdminLayout';
import './Dashboard.css';
import './Topups.css';

const METHOD_LABELS = {
  bank: 'Chuyển khoản',
  momo: 'MoMo',
  zalo: 'ZaloPay',
  card: 'Thẻ ATM/Visa',
};

const FILTER_TABS = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'success', label: 'Đã duyệt' },
  { key: 'failed',  label: 'Từ chối' },
  { key: 'all',     label: 'Tất cả' },
];

export default function AdminTopups({ user, onLogout }) {
  const [items,    setItems]    = useState([]);
  const [revenue,  setRevenue]  = useState(null);
  const [filter,   setFilter]   = useState('pending');
  const [loading,  setLoading]  = useState(true);
  const [refInput, setRefInput] = useState({});
  const [toast,    setToast]    = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [topupRes, revRes] = await Promise.all([
        adminGetTopupsApi(filter === 'all' ? null : filter),
        adminGetRevenueApi(),
      ]);
      setItems(topupRes.items);
      setRevenue(revRes);
    } catch (err) {
      showToast('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      await adminApproveTopupApi(id, refInput[id] || '');
      showToast('Đã duyệt nạp tiền thành công');
      fetchData();
    } catch (err) {
      showToast('Lỗi: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Từ chối yêu cầu nạp tiền này?')) return;
    try {
      await adminRejectTopupApi(id);
      showToast('Đã từ chối yêu cầu');
      fetchData();
    } catch (err) {
      showToast('Lỗi: ' + err.message);
    }
  };

  const statCards = revenue ? [
    { icon: '⬆️', label: 'Tổng đã nạp',          value: Number(revenue.tong_nap).toLocaleString('vi-VN') + 'đ', color: 'green'  },
    { icon: '🛒', label: 'Tổng mua gói',           value: Number(revenue.tong_chi).toLocaleString('vi-VN') + 'đ', color: 'blue'   },
    { icon: '⏳', label: 'Chờ duyệt',              value: revenue.cho_duyet_nap,                                  color: 'orange' },
    { icon: '✅', label: 'Giao dịch nạp thành công', value: revenue.gd_nap_thanh_cong,                            color: 'green'  },
  ] : [];

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Quản lý nạp tiền" subtitle="Duyệt và quản lý yêu cầu nạp tiền của chủ nhà">
      {/* STATS */}
      {statCards.length > 0 && (
        <div className="adm-stats-grid" style={{ marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} className={`adm-stat-card adm-stat-${s.color}`}>
              <div className="adm-stat-top">
                <span className="adm-stat-icon">{s.icon}</span>
                <strong className="adm-stat-value">{s.value}</strong>
              </div>
              <p className="adm-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-header">
          <h2>Danh sách yêu cầu nạp tiền</h2>
          <div className="ar-tabs">
            {FILTER_TABS.map(t => (
              <button key={t.key}
                className={`ar-tab ${filter === t.key ? 'active' : ''}`}
                onClick={() => setFilter(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="ar-empty">⏳ Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="ar-empty">Không có yêu cầu nào</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Mã tham chiếu</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="tp-id">#{item.id}</td>
                    <td>
                      <div className="au-user-cell">
                        <div className="au-avatar">{item.userName?.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.userName}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.account}</div>
                        </div>
                      </div>
                    </td>
                    <td className="tp-amount">+{Number(item.amount).toLocaleString('vi-VN')}đ</td>
                    <td>{METHOD_LABELS[item.method] || item.method}</td>
                    <td>
                      {item.status === 'pending' ? (
                        <input
                          type="text"
                          placeholder="Nhập mã CK..."
                          value={refInput[item.id] || ''}
                          onChange={e => setRefInput(p => ({ ...p, [item.id]: e.target.value }))}
                          className="adm-input tp-ref-input"
                        />
                      ) : (
                        <span style={{ color: '#64748b' }}>{item.ref || '—'}</span>
                      )}
                    </td>
                    <td className="adm-td-time">{item.createdAt}</td>
                    <td>
                      <span className={
                        item.status === 'success' ? 'adm-badge adm-badge-approved' :
                        item.status === 'pending' ? 'adm-badge adm-badge-pending'  :
                        'adm-badge adm-badge-rejected'
                      }>
                        {item.status === 'success' ? 'Đã duyệt' :
                         item.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                      </span>
                    </td>
                    <td>
                      {item.status === 'pending' && (
                        <div className="adm-action-btns">
                          <button className="adm-btn-approve" onClick={() => handleApprove(item.id)}>
                            ✓ Duyệt
                          </button>
                          <button className="adm-btn-reject" onClick={() => handleReject(item.id)}>
                            ✕ Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div className="tp-toast">{toast}</div>
      )}
    </AdminLayout>
  );
}
