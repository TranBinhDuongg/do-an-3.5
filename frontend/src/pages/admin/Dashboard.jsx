import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminGetDashboardApi, adminUpdateRoomStatusApi } from '../../api/admin';
import AdminLayout from '../../components/AdminLayout';
import './Dashboard.css';

export default function AdminDashboard({ user, onLogout }) {
  const [loading, setLoading]       = useState(true);
  const [stats, setStats]           = useState(null);
  const [pendingRooms, setPending]  = useState([]);
  const [recentUsers, setUsers]     = useState([]);
  const [approveMap, setApproveMap] = useState({});

  useEffect(() => {
    adminGetDashboardApi()
      .then(d => {
        setStats(d.stats);
        setPending(d.pendingRooms);
        setUsers(d.recentUsers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminUpdateRoomStatusApi(id, 'approved');
      setApproveMap(p => ({ ...p, [id]: 'approved' }));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      await adminUpdateRoomStatusApi(id, 'rejected');
      setApproveMap(p => ({ ...p, [id]: 'rejected' }));
    } catch (err) { console.error(err); }
  };

  const statCards = stats ? [
    { icon: '👥', label: 'Tổng người dùng', value: stats.totalUsers?.toLocaleString('vi-VN'), sub: `+${stats.newUsersToday} hôm nay`, color: 'blue' },
    { icon: '🏠', label: 'Tổng tin đăng',   value: stats.totalRooms?.toLocaleString('vi-VN'), sub: `+${stats.newRoomsToday} hôm nay`, color: 'green' },
    { icon: '⏳', label: 'Chờ duyệt',        value: stats.pending,      sub: 'Cần xử lý',     color: 'orange' },
    { icon: '🚫', label: 'Đã từ chối',       value: stats.rejected7days, sub: 'Trong 7 ngày', color: 'red' },
  ] : [];

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Tổng quan hệ thống" subtitle={`Chào mừng trở lại, ${user?.name || 'Admin'}`}>
      {loading ? (
        <div style={{ padding: '2rem', color: '#94a3b8' }}>Đang tải...</div>
      ) : (
        <>
          {/* STATS */}
          <div className="adm-stats-grid">
            {statCards.map(s => (
              <div key={s.label} className={`adm-stat-card adm-stat-${s.color}`}>
                <div className="adm-stat-top">
                  <span className="adm-stat-icon">{s.icon}</span>
                  <strong className="adm-stat-value">{s.value}</strong>
                </div>
                <p className="adm-stat-label">{s.label}</p>
                <span className="adm-stat-sub">{s.sub}</span>
              </div>
            ))}
          </div>

          <div className="adm-content-grid">
            {/* PENDING ROOMS */}
            <div className="adm-card">
              <div className="adm-card-header">
                <h2>⏳ Tin đăng chờ duyệt</h2>
                <Link to="/admin/rooms" className="adm-see-all">Xem tất cả →</Link>
              </div>
              {pendingRooms.length === 0 ? (
                <p style={{ padding: '1rem', color: '#94a3b8' }}>Không có tin nào chờ duyệt.</p>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Tiêu đề</th>
                        <th>Chủ nhà</th>
                        <th>Loại</th>
                        <th>Giá</th>
                        <th>Thời gian</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRooms.map(r => {
                        const status = approveMap[r.id];
                        return (
                          <tr key={r.id}>
                            <td className="adm-td-title">{r.title}</td>
                            <td>{r.employer}</td>
                            <td><span className="adm-type-badge">{r.type}</span></td>
                            <td>{Number(r.price).toLocaleString('vi-VN')}đ</td>
                            <td className="adm-td-time">{r.submittedAt}</td>
                            <td>
                              {status === 'approved' && <span className="adm-status approved">✅ Đã duyệt</span>}
                              {status === 'rejected' && <span className="adm-status rejected">❌ Từ chối</span>}
                              {!status && (
                                <div className="adm-action-btns">
                                  <button className="adm-btn-approve" onClick={() => handleApprove(r.id)}>✓ Duyệt</button>
                                  <button className="adm-btn-reject"  onClick={() => handleReject(r.id)}>✕ Từ chối</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RECENT USERS */}
            <div className="adm-card">
              <div className="adm-card-header">
                <h2>👥 Người dùng mới</h2>
                <Link to="/admin/users" className="adm-see-all">Xem tất cả →</Link>
              </div>
              <div className="adm-user-list">
                {recentUsers.map(u => (
                  <div key={u.id} className="adm-user-row">
                    <div className="adm-user-avatar">{u.name.charAt(0)}</div>
                    <div className="adm-user-info">
                      <strong>{u.name}</strong>
                      <span>@{u.username}</span>
                    </div>
                    <span className={`adm-role-badge ${u.role}`}>
                      {u.role === 'employer' ? 'Chủ nhà' : 'Người thuê'}
                    </span>
                    <span className="adm-user-time">{u.joinedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
