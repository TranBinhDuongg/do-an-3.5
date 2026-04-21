import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Rooms.css';

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/rooms',     icon: '🏠', label: 'Quản lý tin đăng' },
  { path: '/admin/users',     icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/reports',   icon: '📋', label: 'Báo cáo' },
];

const ROOMS = [
  { id: 1, title: 'Phòng trọ cao cấp gần ĐH Bách Khoa', employer: 'Nguyễn Văn Minh', city: 'Hà Nội', price: 3500000, type: 'Phòng trọ', status: 'pending',  submittedAt: '21/04/2026' },
  { id: 2, title: 'Studio trung tâm quận 1',             employer: 'Trần Thị Lan',    city: 'TP. HCM', price: 8000000, type: 'Studio',    status: 'approved', submittedAt: '20/04/2026' },
  { id: 3, title: 'Nhà nguyên căn 3PN sân vườn',         employer: 'Nguyễn Văn Minh', city: 'Hà Nội', price: 12000000, type: 'Nhà nguyên căn', status: 'pending', submittedAt: '20/04/2026' },
  { id: 4, title: 'Chung cư mini full nội thất',          employer: 'Lê Văn Nam',      city: 'Đà Nẵng', price: 5500000, type: 'Chung cư mini', status: 'rejected', submittedAt: '19/04/2026' },
  { id: 5, title: 'Phòng trọ giá rẻ gần KCN Tân Bình',  employer: 'Phạm Thị Hoa',    city: 'TP. HCM', price: 2200000, type: 'Phòng trọ', status: 'approved', submittedAt: '19/04/2026' },
  { id: 6, title: 'Căn hộ dịch vụ cao cấp Cầu Giấy',    employer: 'Hoàng Minh Tuấn', city: 'Hà Nội', price: 9500000, type: 'Căn hộ dịch vụ', status: 'pending', submittedAt: '18/04/2026' },
  { id: 7, title: 'Phòng trọ sạch sẽ gần bệnh viện',    employer: 'Vũ Thị Mai',      city: 'Hải Phòng', price: 1800000, type: 'Phòng trọ', status: 'approved', submittedAt: '18/04/2026' },
  { id: 8, title: 'Nhà trọ 5 phòng hẻm yên tĩnh',       employer: 'Đặng Văn Hùng',   city: 'Cần Thơ', price: 1500000, type: 'Phòng trọ', status: 'rejected', submittedAt: '17/04/2026' },
];

const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'pending',  label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

const STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };

export default function AdminRooms({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [statusMap, setStatusMap] = useState({});
  const [detail, setDetail]     = useState(null);

  const getStatus = (r) => statusMap[r.id] ?? r.status;

  const filtered = ROOMS.filter(r => {
    const matchTab = tab === 'all' || getStatus(r) === tab;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                        r.employer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all:      ROOMS.length,
    pending:  ROOMS.filter(r => getStatus(r) === 'pending').length,
    approved: ROOMS.filter(r => getStatus(r) === 'approved').length,
    rejected: ROOMS.filter(r => getStatus(r) === 'rejected').length,
  };

  const approve = (id) => { setStatusMap(p => ({ ...p, [id]: 'approved' })); setDetail(null); };
  const reject  = (id) => { setStatusMap(p => ({ ...p, [id]: 'rejected' })); setDetail(null); };

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
        {/* TOPBAR */}
        <header className="adm-topbar">
          <div>
            <h1>Quản lý tin đăng</h1>
            <p>Duyệt và quản lý tất cả tin đăng phòng trọ</p>
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
          {/* STATS ROW */}
          <div className="ar-stats-row">
            {TABS.map(t => (
              <div key={t.key} className={`ar-stat-pill ar-stat-${t.key}`}>
                <span className="ar-stat-num">{counts[t.key]}</span>
                <span className="ar-stat-lbl">{t.label}</span>
              </div>
            ))}
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
                    <span className="ar-tab-count">{counts[t.key]}</span>
                  </button>
                ))}
              </div>
              <input
                className="ar-search"
                placeholder="🔍  Tìm tiêu đề, chủ trọ..."
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
                    <th>Tiêu đề</th>
                    <th>Chủ trọ</th>
                    <th>Loại</th>
                    <th>Thành phố</th>
                    <th>Giá/tháng</th>
                    <th>Ngày đăng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="ar-empty">Không có tin đăng nào</td></tr>
                  )}
                  {filtered.map((r, i) => {
                    const st = getStatus(r);
                    return (
                      <tr key={r.id}>
                        <td className="ar-td-idx">{i + 1}</td>
                        <td className="adm-td-title">{r.title}</td>
                        <td>{r.employer}</td>
                        <td><span className="adm-type-badge">{r.type}</span></td>
                        <td>{r.city}</td>
                        <td className="ar-td-price">{r.price.toLocaleString('vi-VN')}đ</td>
                        <td className="adm-td-time">{r.submittedAt}</td>
                        <td><span className={`ar-status ar-status-${st}`}>{STATUS_LABEL[st]}</span></td>
                        <td>
                          <div className="adm-action-btns">
                            <button className="ar-btn-detail" onClick={() => setDetail(r)}>👁 Chi tiết</button>
                            {st === 'pending' && (
                              <>
                                <button className="adm-btn-approve" onClick={() => approve(r.id)}>✓</button>
                                <button className="adm-btn-reject"  onClick={() => reject(r.id)}>✕</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detail && (
        <div className="ar-overlay" onClick={() => setDetail(null)}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <h2>Chi tiết tin đăng</h2>
              <button className="ar-modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="ar-modal-body">
              <div className="ar-modal-img">🏠</div>
              <div className="ar-modal-rows">
                <div className="ar-modal-row"><span>Tiêu đề</span><strong>{detail.title}</strong></div>
                <div className="ar-modal-row"><span>Chủ trọ</span><strong>{detail.employer}</strong></div>
                <div className="ar-modal-row"><span>Loại phòng</span><strong>{detail.type}</strong></div>
                <div className="ar-modal-row"><span>Thành phố</span><strong>{detail.city}</strong></div>
                <div className="ar-modal-row"><span>Giá/tháng</span><strong className="ar-modal-price">{detail.price.toLocaleString('vi-VN')}đ</strong></div>
                <div className="ar-modal-row"><span>Ngày đăng</span><strong>{detail.submittedAt}</strong></div>
                <div className="ar-modal-row">
                  <span>Trạng thái</span>
                  <span className={`ar-status ar-status-${getStatus(detail)}`}>{STATUS_LABEL[getStatus(detail)]}</span>
                </div>
              </div>
            </div>
            {getStatus(detail) === 'pending' && (
              <div className="ar-modal-footer">
                <button className="adm-btn-reject ar-modal-btn" onClick={() => reject(detail.id)}>✕ Từ chối</button>
                <button className="adm-btn-approve ar-modal-btn" onClick={() => approve(detail.id)}>✓ Duyệt tin</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
