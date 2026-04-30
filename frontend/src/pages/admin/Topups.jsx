import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { adminGetTopupsApi, adminApproveTopupApi, adminRejectTopupApi, adminGetRevenueApi } from '../../api/wallet';
import './Dashboard.css';

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/rooms',     icon: '🏠', label: 'Quản lý tin đăng' },
  { path: '/admin/users',     icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/topups',    icon: '💵', label: 'Nạp tiền' },
  { path: '/admin/reports',   icon: '📈', label: 'Báo cáo' },
];

const METHOD_LABELS = { bank: 'Chuyển khoản', momo: 'MoMo', zalo: 'ZaloPay', card: 'Thẻ ATM/Visa' };

export default function AdminTopups({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems]       = useState([]);
  const [revenue, setRevenue]   = useState(null);
  const [filter, setFilter]     = useState('pending');
  const [loading, setLoading]   = useState(true);
  const [refInput, setRefInput] = useState({});
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

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
      showToast('Loi tai du lieu: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      await adminApproveTopupApi(id, refInput[id] || '');
      showToast('Da duyet nap tien thanh cong');
      fetchData();
    } catch (err) {
      showToast('Loi: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Tu choi yeu cau nap tien nay?')) return;
    try {
      await adminRejectTopupApi(id);
      showToast('Da tu choi yeu cau');
      fetchData();
    } catch (err) {
      showToast('Loi: ' + err.message);
    }
  };

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <span>🏠</span>
          <span>PhongTro<b>VN</b></span>
        </div>
        <p className="adm-sidebar-role">Quan tri vien</p>
        <nav className="adm-nav">
          {NAV.map(n => (
            <Link key={n.path} to={n.path}
              className={`adm-nav-item ${location.pathname === n.path ? 'active' : ''}`}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <button className="adm-logout-btn" onClick={() => { onLogout?.(); navigate('/admin/login'); }}>
          Dang xuat
        </button>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <div>
            <h1>Quan ly nap tien</h1>
            <p>Duyet va quan ly yeu cau nap tien cua chu tro</p>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="adm-avatar">{user?.name?.charAt(0) || 'A'}</div>
              <span>{user?.name || 'Admin'}</span>
              <span>v</span>
            </button>
            {menuOpen && (
              <div className="adm-user-dropdown">
                <button className="adm-drop-logout" onClick={() => { onLogout?.(); navigate('/admin/login'); }}>
                  Dang xuat
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="adm-body">
          {revenue && (
            <div className="adm-stats-grid" style={{ marginBottom: 24 }}>
              {[
                { icon: '⬆️', label: 'Tong da nap',       value: Number(revenue.tong_nap).toLocaleString('vi-VN') + 'd', color: 'green' },
                { icon: '🛒', label: 'Tong mua goi',       value: Number(revenue.tong_chi).toLocaleString('vi-VN') + 'd', color: 'blue' },
                { icon: '⏳', label: 'Cho duyet',           value: revenue.cho_duyet_nap,     color: 'orange' },
                { icon: '✅', label: 'GD nap thanh cong',  value: revenue.gd_nap_thanh_cong, color: 'green' },
              ].map(s => (
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
              <h2>Danh sach yeu cau nap tien</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['pending','Cho duyet'],['success','Da duyet'],['failed','Tu choi'],['all','Tat ca']].map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v)}
                    className={filter === v ? 'adm-btn adm-btn-primary' : 'adm-btn adm-btn-ghost'}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', color: '#94a3b8' }}>Dang tai...</div>
            ) : items.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Khong co yeu cau nao</div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nguoi dung</th>
                      <th>So tien</th>
                      <th>Phuong thuc</th>
                      <th>Ma tham chieu</th>
                      <th>Ngay tao</th>
                      <th>Trang thai</th>
                      <th>Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.userName}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.account}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#22c55e' }}>
                          +{Number(item.amount).toLocaleString('vi-VN')}d
                        </td>
                        <td>{METHOD_LABELS[item.method] || item.method}</td>
                        <td>
                          {item.status === 'pending' ? (
                            <input
                              type="text"
                              placeholder="Nhap ma CK..."
                              value={refInput[item.id] || ''}
                              onChange={e => setRefInput(p => ({ ...p, [item.id]: e.target.value }))}
                              className="adm-input"
                              style={{ width: 130 }}
                            />
                          ) : (
                            <span style={{ color: '#64748b' }}>{item.ref || '-'}</span>
                          )}
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>{item.createdAt}</td>
                        <td>
                          <span className={
                            item.status === 'success' ? 'adm-badge adm-badge-approved' :
                            item.status === 'pending' ? 'adm-badge adm-badge-pending' :
                            'adm-badge adm-badge-rejected'
                          }>
                            {item.status === 'success' ? 'Da duyet' : item.status === 'pending' ? 'Cho duyet' : 'Tu choi'}
                          </span>
                        </td>
                        <td>
                          {item.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="adm-btn adm-btn-approve" onClick={() => handleApprove(item.id)}>
                                Duyet
                              </button>
                              <button className="adm-btn adm-btn-reject" onClick={() => handleReject(item.id)}>
                                Tu choi
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
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#1e293b', color: '#fff',
          padding: '12px 20px', borderRadius: 10,
          fontSize: 14, zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
