import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const stats = [
  { icon: '👥', label: 'Tổng người dùng', value: '5,240', sub: '+12 hôm nay', color: 'blue' },
  { icon: '🏠', label: 'Tổng tin đăng', value: '1,832', sub: '+8 hôm nay', color: 'green' },
  { icon: '⏳', label: 'Chờ duyệt', value: '24', sub: 'Cần xử lý', color: 'orange' },
  { icon: '🚫', label: 'Đã từ chối', value: '6', sub: 'Trong 7 ngày', color: 'red' },
];

const pendingRooms = [
  { id: 1, title: 'Phòng trọ cao cấp gần ĐH Bách Khoa', employer: 'Nguyễn Văn Minh', city: 'Hà Nội', price: 3500000, type: 'Phòng trọ', submittedAt: '2 giờ trước' },
  { id: 2, title: 'Studio trung tâm quận 1', employer: 'Trần Thị Lan', city: 'TP. HCM', price: 8000000, type: 'Studio', submittedAt: '4 giờ trước' },
  { id: 3, title: 'Nhà nguyên căn 3PN sân vườn', employer: 'Nguyễn Văn Minh', city: 'Hà Nội', price: 12000000, type: 'Nhà nguyên căn', submittedAt: '5 giờ trước' },
  { id: 4, title: 'Chung cư mini full nội thất', employer: 'Lê Văn Nam', city: 'Đà Nẵng', price: 5500000, type: 'Chung cư mini', submittedAt: '1 ngày trước' },
];

const recentUsers = [
  { id: 1, name: 'Nguyễn Văn A', username: 'nguyenvana', role: 'user', joinedAt: '1 giờ trước' },
  { id: 2, name: 'Trần Thị B', username: 'tranthib', role: 'employer', joinedAt: '3 giờ trước' },
  { id: 3, name: 'Lê Văn C', username: 'levanc', role: 'user', joinedAt: '5 giờ trước' },
  { id: 4, name: 'Phạm Thị D', username: 'phamthid', role: 'employer', joinedAt: '1 ngày trước' },
];

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/rooms',     icon: '🏠', label: 'Quản lý tin đăng' },
  { path: '/admin/users',     icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/reports',   icon: '📋', label: 'Báo cáo' },
];

export default function AdminDashboard({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [approveMap, setApproveMap] = useState({});
  const navigate = useNavigate();

  const handleApprove = (id) => setApproveMap(p => ({ ...p, [id]: 'approved' }));
  const handleReject  = (id) => setApproveMap(p => ({ ...p, [id]: 'rejected' }));

  return (
    <div className="adm-layout">
      {/* SIDEBAR */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <span>🏠</span>
          <span>PhòngTrọ<b>VN</b></span>
        </div>
        <p className="adm-sidebar-role">Quản trị viên</p>

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
          🚪 Đăng xuất
        </button>
      </aside>

      {/* MAIN */}
      <div className="adm-main">
        {/* TOPBAR */}
        <header className="adm-topbar">
          <div>
            <h1>Tổng quan hệ thống</h1>
            <p>Chào mừng trở lại, <strong>{user?.name || 'Admin'}</strong></p>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="adm-avatar">{user?.name?.charAt(0) || 'A'}</div>
              <span>{user?.name || 'Admin'}</span>
              <span>▾</span>
            </button>
            {menuOpen && (
              <div className="adm-user-dropdown">
                <button className="adm-drop-logout" onClick={() => { onLogout?.(); navigate('/admin/login'); }}>
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="adm-body">
          {/* STATS */}
          <div className="adm-stats-grid">
            {stats.map(s => (
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
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Chủ trọ</th>
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
                          <td>{r.price.toLocaleString('vi-VN')}đ</td>
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
                      {u.role === 'employer' ? 'Chủ trọ' : 'Người thuê'}
                    </span>
                    <span className="adm-user-time">{u.joinedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
