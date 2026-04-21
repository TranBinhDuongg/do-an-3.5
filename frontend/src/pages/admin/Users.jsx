import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Users.css';

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/rooms',     icon: '🏠', label: 'Quản lý tin đăng' },
  { path: '/admin/users',     icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/reports',   icon: '📋', label: 'Báo cáo' },
];

const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'user',     label: 'Người thuê' },
  { key: 'employer', label: 'Chủ trọ' },
  { key: 'admin',    label: 'Admin' },
];

const ROLE_LABEL = { user: 'Người thuê', employer: 'Chủ trọ', admin: 'Admin' };

const MOCK_USERS = [
  { id: 1,  name: 'Nguyễn Văn An',   username: 'nguyenvanan',   phone: '0901234567', role: 'user',     active: true,  rooms: 0,  joinedAt: '15/01/2026' },
  { id: 2,  name: 'Trần Thị Bình',   username: 'tranthiminh',   phone: '0912345678', role: 'employer', active: true,  rooms: 5,  joinedAt: '20/01/2026' },
  { id: 3,  name: 'Lê Văn Cường',    username: 'levanc',        phone: '0923456789', role: 'user',     active: false, rooms: 0,  joinedAt: '01/02/2026' },
  { id: 4,  name: 'Phạm Thị Dung',   username: 'phamthidung',   phone: '0934567890', role: 'employer', active: true,  rooms: 3,  joinedAt: '05/02/2026' },
  { id: 5,  name: 'Hoàng Minh Em',   username: 'hoangminhem',   phone: '0945678901', role: 'user',     active: true,  rooms: 0,  joinedAt: '10/02/2026' },
  { id: 6,  name: 'Vũ Thị Phương',   username: 'vuthiphuong',   phone: '0956789012', role: 'employer', active: false, rooms: 2,  joinedAt: '14/02/2026' },
  { id: 7,  name: 'Đặng Văn Giang',  username: 'dangvangiang',  phone: '0967890123', role: 'user',     active: true,  rooms: 0,  joinedAt: '18/02/2026' },
  { id: 8,  name: 'Bùi Thị Hoa',     username: 'buithihoa',     phone: '0978901234', role: 'employer', active: true,  rooms: 8,  joinedAt: '22/02/2026' },
  { id: 9,  name: 'Ngô Văn Inh',     username: 'ngovanin',      phone: '0989012345', role: 'user',     active: true,  rooms: 0,  joinedAt: '01/03/2026' },
  { id: 10, name: 'Đinh Thị Kim',    username: 'dinhthikim',    phone: '0990123456', role: 'admin',    active: true,  rooms: 0,  joinedAt: '01/01/2026' },
];

export default function AdminUsers({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab,      setTab]      = useState('all');
  const [search,   setSearch]   = useState('');
  const [detail,   setDetail]   = useState(null);
  const [statusMap, setStatusMap] = useState({});

  const getActive = (u) => statusMap[u.id] !== undefined ? statusMap[u.id] : u.active;

  const filtered = MOCK_USERS.filter(u => {
    const matchTab    = tab === 'all' || u.role === tab;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.phone.includes(search);
    return matchTab && matchSearch;
  });

  const counts = {
    all:      MOCK_USERS.length,
    user:     MOCK_USERS.filter(u => u.role === 'user').length,
    employer: MOCK_USERS.filter(u => u.role === 'employer').length,
    admin:    MOCK_USERS.filter(u => u.role === 'admin').length,
  };

  const toggleActive = (id) => {
    const cur = getActive(MOCK_USERS.find(u => u.id === id));
    setStatusMap(p => ({ ...p, [id]: !cur }));
    if (detail?.id === id) setDetail(d => ({ ...d, _active: !cur }));
  };

  const activeUser = (u) => detail?.id === u.id
    ? (detail._active !== undefined ? detail._active : getActive(u))
    : getActive(u);

  return (
    <div className="adm-layout">
      {/* SIDEBAR */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo"><span>🏠</span><span>PhòngTrọ<b>VN</b></span></div>
        <p className="adm-sidebar-role">Quản trị viên</p>
        <nav className="adm-nav">
          {NAV.map(n => (
            <Link key={n.path} to={n.path}
              className={`adm-nav-item ${location.pathname === n.path ? 'active' : ''}`}>
              <span>{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <button className="adm-logout-btn" onClick={() => { onLogout?.(); navigate('/admin/login'); }}>
          🚪 Đăng xuất
        </button>
      </aside>

      {/* MAIN */}
      <div className="adm-main">
        <header className="adm-topbar">
          <div>
            <h1>Quản lý người dùng</h1>
            <p>Xem và quản lý tài khoản người dùng trong hệ thống</p>
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
          <div className="au-stats-row">
            <div className="au-stat-card au-stat-all">
              <span className="au-stat-icon">👥</span>
              <div><strong>{counts.all}</strong><span>Tổng người dùng</span></div>
            </div>
            <div className="au-stat-card au-stat-user">
              <span className="au-stat-icon">🧑</span>
              <div><strong>{counts.user}</strong><span>Người thuê</span></div>
            </div>
            <div className="au-stat-card au-stat-employer">
              <span className="au-stat-icon">🏠</span>
              <div><strong>{counts.employer}</strong><span>Chủ trọ</span></div>
            </div>
            <div className="au-stat-card au-stat-active">
              <span className="au-stat-icon">✅</span>
              <div>
                <strong>{MOCK_USERS.filter(u => getActive(u)).length}</strong>
                <span>Đang hoạt động</span>
              </div>
            </div>
            <div className="au-stat-card au-stat-locked">
              <span className="au-stat-icon">🔒</span>
              <div>
                <strong>{MOCK_USERS.filter(u => !getActive(u)).length}</strong>
                <span>Đã khóa</span>
              </div>
            </div>
          </div>

          <div className="adm-card">
            {/* TOOLBAR */}
            <div className="ar-toolbar">
              <div className="ar-tabs">
                {TABS.map(t => (
                  <button key={t.key}
                    className={`ar-tab ${tab === t.key ? 'active' : ''}`}
                    onClick={() => setTab(t.key)}>
                    {t.label}
                    <span className="ar-tab-count">{counts[t.key] ?? MOCK_USERS.length}</span>
                  </button>
                ))}
              </div>
              <input
                className="ar-search"
                placeholder="🔍  Tìm tên, username, SĐT..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* TABLE */}
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Người dùng</th>
                    <th>Username</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò</th>
                    <th>Tin đăng</th>
                    <th>Ngày tham gia</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="ar-empty">Không tìm thấy người dùng nào</td></tr>
                  )}
                  {filtered.map((u, i) => (
                    <tr key={u.id}>
                      <td className="ar-td-idx">{i + 1}</td>
                      <td>
                        <div className="au-user-cell">
                          <div className="au-avatar">{u.name.charAt(0)}</div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="au-td-username">@{u.username}</td>
                      <td>{u.phone}</td>
                      <td><span className={`au-role-badge au-role-${u.role}`}>{ROLE_LABEL[u.role]}</span></td>
                      <td className="au-td-rooms">
                        {u.role === 'employer' ? <span className="au-rooms-count">{u.rooms} tin</span> : '—'}
                      </td>
                      <td className="adm-td-time">{u.joinedAt}</td>
                      <td>
                        <span className={`au-status ${getActive(u) ? 'au-active' : 'au-locked'}`}>
                          {getActive(u) ? '● Hoạt động' : '● Đã khóa'}
                        </span>
                      </td>
                      <td>
                        <div className="adm-action-btns">
                          <button className="ar-btn-detail" onClick={() => setDetail(u)}>👁</button>
                          <button
                            className={getActive(u) ? 'au-btn-lock' : 'au-btn-unlock'}
                            onClick={() => toggleActive(u.id)}
                            title={getActive(u) ? 'Khóa tài khoản' : 'Mở khóa'}>
                            {getActive(u) ? '🔒' : '🔓'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detail && (
        <div className="ar-overlay" onClick={() => setDetail(null)}>
          <div className="ar-modal au-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <h2>Chi tiết người dùng</h2>
              <button className="ar-modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="ar-modal-body">
              {/* Avatar + name */}
              <div className="au-modal-profile">
                <div className="au-modal-avatar">{detail.name.charAt(0)}</div>
                <div>
                  <strong>{detail.name}</strong>
                  <span>@{detail.username}</span>
                </div>
                <span className={`au-role-badge au-role-${detail.role}`}>{ROLE_LABEL[detail.role]}</span>
              </div>

              <div className="ar-modal-rows">
                <div className="ar-modal-row"><span>Số điện thoại</span><strong>{detail.phone}</strong></div>
                <div className="ar-modal-row"><span>Ngày tham gia</span><strong>{detail.joinedAt}</strong></div>
                {detail.role === 'employer' && (
                  <div className="ar-modal-row"><span>Tin đăng</span><strong>{detail.rooms} tin</strong></div>
                )}
                <div className="ar-modal-row">
                  <span>Trạng thái</span>
                  <span className={`au-status ${getActive(detail) ? 'au-active' : 'au-locked'}`}>
                    {getActive(detail) ? '● Hoạt động' : '● Đã khóa'}
                  </span>
                </div>
              </div>
            </div>
            <div className="ar-modal-footer">
              {getActive(detail)
                ? <button className="au-btn-lock au-modal-btn" onClick={() => toggleActive(detail.id)}>🔒 Khóa tài khoản</button>
                : <button className="au-btn-unlock au-modal-btn" onClick={() => toggleActive(detail.id)}>🔓 Mở khóa</button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
