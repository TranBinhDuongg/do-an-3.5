import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './UserNavbar.css';

const ROLE_LABEL = { user: 'Người thuê', employer: 'Chủ trọ', admin: 'Quản trị viên' };

const NAV_LINKS = [
  { to: '/',          label: 'Trang chủ',  exact: true },
  { to: '/search',    label: 'Tìm phòng' },
  { to: '/favorites', label: 'Yêu thích' },
];

export default function UserNavbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to, exact) => exact ? pathname === to : pathname.startsWith(to);

  return (
    <nav className="unav">
      <div className="unav-inner">
        <Link to="/" className="unav-logo">🏠 ThueNha<span>VN</span></Link>

        <div className="unav-links">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`unav-link${isActive(link.to, link.exact) ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="unav-auth">
          {user ? (
            <div className="unav-user-wrap">
              <button className="unav-user-btn" onClick={() => setMenuOpen(o => !o)}>
                <div className="unav-avatar">
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="avatar" />
                    : user.name?.charAt(0)}
                </div>
                <div className="unav-user-info">
                  <span className="unav-user-name">{user.name}</span>
                  <span className="unav-user-role">{ROLE_LABEL[user.role] || user.role}</span>
                </div>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div className="unav-dropdown">
                  <Link to="/profile" className="unav-drop-item" onClick={() => setMenuOpen(false)}>👤 Hồ sơ</Link>
                  <hr className="unav-drop-hr" />
                  <button className="unav-drop-logout" onClick={() => { onLogout?.(); setMenuOpen(false); navigate('/login'); }}>
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    className="unav-btn-outline">Đăng nhập</Link>
              <Link to="/register" className="unav-btn-primary">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
