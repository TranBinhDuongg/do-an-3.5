import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  adminGetUsersApi,
  adminGetUserStatsApi,
  adminUpdateUserStatusApi,
} from '../../api/admin';
import './Dashboard.css';
import './Users.css';

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/rooms',     icon: '🏠', label: 'Quản lý tin đăng' },
  { path: '/admin/users',     icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/topups',    icon: '💵', label: 'Nạp tiền' },
  { path: '/admin/reports',   icon: '📈', label: 'Báo cáo' },
];

const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'user',     label: 'Người thuê' },
  { key: 'employer', label: 'Chủ trọ' },
  { key: 'admin',    label: 'Admin' },
];

const ROLE_LABEL = { user: 'Người thuê', employer: 'Chủ trọ', admin: 'Admin' };

export default function AdminUsers({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Filter
  const [tab,    setTab]    = useState('all');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  // Data
  const [users,      setUsers]      = useState([]);
  const [stats,      setStats]      = useState({ all: 0, user: 0, employer: 0, admin: 0, active: 0, locked: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // Modal
  const [detail,        setDetail]        = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (tab !== 'all')    params.role    = tab;
      if (search.trim())    params.keyword = search.trim();
      const [listData, statsData] = await Promise.all([
        adminGetUsersApi(params),
        adminGetUserStatsApi(),
      ]);
      setUsers(listData.users);
      setTotalPages(listData.totalPages);
      setStats(statsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const toggleActive = async (u) => {
    const newActive = !u.active;
    setActionLoading(p => ({ ...p, [u.id]: true }));
    try {
      await adminUpdateUserStatusApi(u.id, newActive);
      await fetchUsers();
      // cập nhật modal nếu đang mở
      if (detail?.id === u.id) setDetail(d => ({ ...d, active: newActive }));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(p => ({ ...p, [u.id]: false }));
    }
  };

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
              <div><strong>{stats.all}</strong><span>Tổng người dùng</span></div>
            </div>
            <div className="au-stat-card au-stat-user">
              <span className="au-stat-icon">🧑</span>
              <div><strong>{stats.user}</strong><span>Người thuê</span></div>
            </div>
            <div className="au-stat-card au-stat-employer">
              <span className="au-stat-icon">🏠</span>
              <div><strong>{stats.employer}</strong><span>Chủ trọ</span></div>
            </div>
            <div className="au-stat-card au-stat-active">
              <span className="au-stat-icon">✅</span>
              <div><strong>{stats.active}</strong><span>Đang hoạt động</span></div>
            </div>
            <div className="au-stat-card au-stat-locked">
              <span className="au-stat-icon">🔒</span>
              <div><strong>{stats.locked}</strong><span>Đã khóa</span></div>
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
                    <span className="ar-tab-count">{stats[t.key] ?? stats.all}</span>
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

            {error && <p className="ar-error">⚠️ {error}</p>}

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
                  {loading && (
                    <tr><td colSpan={9} className="ar-empty">⏳ Đang tải...</td></tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr><td colSpan={9} className="ar-empty">Không tìm thấy người dùng nào</td></tr>
                  )}
                  {!loading && users.map((u, i) => (
                    <tr key={u.id}>
                      <td className="ar-td-idx">{(page - 1) * 10 + i + 1}</td>
                      <td>
                        <div className="au-user-cell">
                          <div className="au-avatar">{u.name?.charAt(0)}</div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="au-td-username">@{u.username}</td>
                      <td>{u.phone || '—'}</td>
                      <td><span className={`au-role-badge au-role-${u.role}`}>{ROLE_LABEL[u.role]}</span></td>
                      <td className="au-td-rooms">
                        {u.role === 'employer'
                          ? <span className="au-rooms-count">{u.rooms} tin</span>
                          : '—'}
                      </td>
                      <td className="adm-td-time">
                        {new Date(u.joinedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <span className={`au-status ${u.active ? 'au-active' : 'au-locked'}`}>
                          {u.active ? '● Hoạt động' : '● Đã khóa'}
                        </span>
                      </td>
                      <td>
                        <div className="adm-action-btns">
                          <button className="ar-btn-detail"
                            onClick={() => setDetail(u)}
                            disabled={actionLoading[u.id]}>👁</button>
                          <button
                            className={u.active ? 'au-btn-unlock' : 'au-btn-lock'}
                            disabled={actionLoading[u.id]}
                            onClick={() => toggleActive(u)}
                            title={u.active ? 'Khóa tài khoản' : 'Mở khóa'}>
                            {actionLoading[u.id] ? '…' : (u.active ? '🔓' : '🔒')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="ar-pagination">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Trước</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau ›</button>
              </div>
            )}
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
              <div className="au-modal-profile">
                <div className="au-modal-avatar">{detail.name?.charAt(0)}</div>
                <div>
                  <strong>{detail.name}</strong>
                  <span>@{detail.username}</span>
                </div>
                <span className={`au-role-badge au-role-${detail.role}`}>{ROLE_LABEL[detail.role]}</span>
              </div>
              <div className="ar-modal-rows">
                <div className="ar-modal-row"><span>Số điện thoại</span><strong>{detail.phone || '—'}</strong></div>
                <div className="ar-modal-row">
                  <span>Ngày tham gia</span>
                  <strong>{new Date(detail.joinedAt).toLocaleDateString('vi-VN')}</strong>
                </div>
                {detail.role === 'employer' && (
                  <div className="ar-modal-row"><span>Tin đăng</span><strong>{detail.rooms} tin</strong></div>
                )}
                <div className="ar-modal-row">
                  <span>Trạng thái</span>
                  <span className={`au-status ${detail.active ? 'au-active' : 'au-locked'}`}>
                    {detail.active ? '● Hoạt động' : '● Đã khóa'}
                  </span>
                </div>
              </div>
            </div>
            <div className="ar-modal-footer">
              {detail.active
                ? <button className="au-btn-unlock au-modal-btn"
                    disabled={actionLoading[detail.id]}
                    onClick={() => toggleActive(detail)}>
                    🔓 Mở khóa
                  </button>
                : <button className="au-btn-lock au-modal-btn"
                    disabled={actionLoading[detail.id]}
                    onClick={() => toggleActive(detail)}>
                    🔒 Khóa tài khoản
                  </button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
