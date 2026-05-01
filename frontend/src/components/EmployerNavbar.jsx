import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './EmployerNavbar.css';

const NAV_LINKS = [
  { to: '/employer',         label: 'Tổng quan' },
  { to: '/employer/rooms',   label: 'Tin đăng' },
  { to: '/employer/wallet',  label: 'Ví của tôi' },
  { to: '/employer/pricing', label: 'Dịch vụ', highlight: true },
];

export default function EmployerNavbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to) => {
    if (to === '/employer') return pathname === '/employer';
    return pathname.startsWith(to);
  };

  return (
    <nav className="emp-nav">
      <div className="emp-nav-inner">
        <Link to="/employer" className="emp-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>

        <div className="emp-nav-links">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`emp-nav-link${link.highlight ? ' emp-nav-link-pricing' : ''}${isActive(link.to) ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="emp-nav-right">
          <NotificationBell user={user} />
          <div className="emp-user-wrap">
            <button className="emp-user-btn" onClick={() => setMenuOpen(o => !o)}>
              <div className="emp-avatar">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" />
                  : (user?.name?.charAt(0) || 'C')}
              </div>
              <div className="emp-user-info">
                <span className="emp-user-name">{user?.name || 'Chủ trọ'}</span>
                <span className="emp-user-role">Chủ trọ</span>
              </div>
              <span>▾</span>
            </button>
            {menuOpen && (
              <div className="emp-user-dropdown">
                <Link to="/profile" className="emp-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                <hr className="emp-drop-hr" />
                <button className="emp-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); navigate('/login'); }}>
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
