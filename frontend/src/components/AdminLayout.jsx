import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../pages/admin/Dashboard.css';

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/rooms',     icon: '🏠', label: 'Quản lý tin đăng' },
  { path: '/admin/users',     icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/topups',    icon: '💵', label: 'Nạp tiền' },
  { path: '/admin/reports',   icon: '📈', label: 'Báo cáo' },
];

export default function AdminLayout({ user, onLogout, title, subtitle, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout?.();
    navigate('/admin/login');
  };

  return (
    <div className="adm-layout">
      {/* SIDEBAR */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <span>🏠</span>
          <span>ThueNha<b>VN</b></span>
        </div>
        <p className="adm-sidebar-role">Quản trị viên</p>
        <nav className="adm-nav">
          {NAV.map(n => (
            <Link
              key={n.path}
              to={n.path}
              className={`adm-nav-item ${location.pathname === n.path ? 'active' : ''}`}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <button className="adm-logout-btn" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </aside>

      {/* MAIN */}
      <div className="adm-main">
        <header className="adm-topbar">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="adm-topbar-right">
            <button className="adm-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="adm-avatar">{user?.name?.charAt(0) || 'A'}</div>
              <span>{user?.name || 'Admin'}</span>
              <span>▾</span>
            </button>
            {menuOpen && (
              <div className="adm-user-dropdown">
                <button className="adm-drop-logout" onClick={handleLogout}>
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="adm-body">
          {children}
        </div>
      </div>
    </div>
  );
}
