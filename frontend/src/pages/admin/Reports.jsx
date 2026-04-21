import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Reports.css';

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
  { path: '/admin/rooms',     icon: '🏠', label: 'Quản lý tin đăng' },
  { path: '/admin/users',     icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/reports',   icon: '📋', label: 'Báo cáo' },
];

// Mỗi entry có date để filter theo range
const MONTHLY_ROOMS = [
  { month: 'T11/25', date: '2025-11-01', posted: 42, approved: 35, rejected: 4 },
  { month: 'T12/25', date: '2025-12-01', posted: 58, approved: 49, rejected: 6 },
  { month: 'T1/26',  date: '2026-01-01', posted: 63, approved: 54, rejected: 5 },
  { month: 'T2/26',  date: '2026-02-01', posted: 71, approved: 60, rejected: 7 },
  { month: 'T3/26',  date: '2026-03-01', posted: 85, approved: 72, rejected: 8 },
  { month: 'T4/26',  date: '2026-04-01', posted: 94, approved: 80, rejected: 9 },
];

const MONTHLY_USERS = [
  { month: 'T11/25', date: '2025-11-01', user: 120, employer: 18 },
  { month: 'T12/25', date: '2025-12-01', user: 145, employer: 22 },
  { month: 'T1/26',  date: '2026-01-01', user: 160, employer: 25 },
  { month: 'T2/26',  date: '2026-02-01', user: 178, employer: 30 },
  { month: 'T3/26',  date: '2026-03-01', user: 210, employer: 35 },
  { month: 'T4/26',  date: '2026-04-01', user: 240, employer: 42 },
];

const ROOM_TYPES = [
  { type: 'Phòng trọ',      count: 820, color: '#3b82f6' },
  { type: 'Chung cư mini',  count: 340, color: '#8b5cf6' },
  { type: 'Studio',         count: 280, color: '#06b6d4' },
  { type: 'Nhà nguyên căn', count: 210, color: '#f97316' },
  { type: 'Căn hộ dịch vụ', count: 130, color: '#ec4899' },
  { type: 'Ký túc xá',      count: 52,  color: '#84cc16' },
];

const TOP_CITIES = [
  { city: 'TP. Hồ Chí Minh', count: 680, pct: 37 },
  { city: 'Hà Nội',           count: 520, pct: 28 },
  { city: 'Đà Nẵng',          count: 210, pct: 11 },
  { city: 'Cần Thơ',          count: 145, pct: 8  },
  { city: 'Hải Phòng',        count: 120, pct: 7  },
  { city: 'Khác',             count: 157, pct: 9  },
];

const TOP_EMPLOYERS = [
  { name: 'Bùi Thị Hoa',     rooms: 8, views: 1240, contacts: 86 },
  { name: 'Trần Thị Lan',     rooms: 6, views: 980,  contacts: 72 },
  { name: 'Nguyễn Văn Minh',  rooms: 5, views: 870,  contacts: 65 },
  { name: 'Phạm Thị Dung',    rooms: 4, views: 640,  contacts: 48 },
  { name: 'Lê Văn Nam',       rooms: 3, views: 510,  contacts: 39 },
];

const SUMMARY = [
  { icon: '🏠', label: 'Tổng tin đăng',    value: '1,832', sub: '+94 tháng này',  color: 'blue'   },
  { icon: '👥', label: 'Tổng người dùng',  value: '5,240', sub: '+240 tháng này', color: 'green'  },
  { icon: '👁', label: 'Lượt xem',         value: '48,320', sub: 'Tháng 4/2026',  color: 'purple' },
  { icon: '📞', label: 'Lượt liên hệ',     value: '3,180', sub: 'Tháng 4/2026',  color: 'orange' },
];

const PRESETS = [
  { label: '30 ngày', days: 30 },
  { label: '3 tháng', days: 90 },
  { label: '6 tháng', days: 180 },
];

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function AdminReports({ user, onLogout }) {
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const today   = new Date('2026-04-21');
  const default6m = new Date(today); default6m.setMonth(default6m.getMonth() - 6);

  const [fromDate, setFromDate] = useState(toInputDate(default6m));
  const [toDate,   setToDate]   = useState(toInputDate(today));
  const [activePreset, setActivePreset] = useState('6 tháng');

  const applyPreset = (preset) => {
    const end   = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - preset.days);
    setFromDate(toInputDate(start));
    setToDate(toInputDate(end));
    setActivePreset(preset.label);
  };

  const handleFromChange = (v) => { setFromDate(v); setActivePreset(''); };
  const handleToChange   = (v) => { setToDate(v);   setActivePreset(''); };

  const roomData = useMemo(() =>
    MONTHLY_ROOMS.filter(d => d.date >= fromDate && d.date <= toDate),
    [fromDate, toDate]);

  const userData = useMemo(() =>
    MONTHLY_USERS.filter(d => d.date >= fromDate && d.date <= toDate),
    [fromDate, toDate]);

  const maxPosted = Math.max(...roomData.map(d => d.posted), 1);
  const maxUsers  = Math.max(...userData.map(d => d.user + d.employer), 1);
  const totalTypes = ROOM_TYPES.reduce((s, t) => s + t.count, 0);

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
            <h1>Báo cáo thống kê</h1>
            <p>Tổng hợp số liệu hoạt động hệ thống</p>
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

          {/* SUMMARY STATS */}
          <div className="adm-stats-grid" style={{ marginBottom: 24 }}>
            {SUMMARY.map(s => (
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

          {/* DATE RANGE + PRESETS */}
          <div className="rp-period-row">
            <span className="rp-period-label">Khoảng thời gian:</span>
            {PRESETS.map(p => (
              <button key={p.label}
                className={`rp-period-btn ${activePreset === p.label ? 'active' : ''}`}
                onClick={() => applyPreset(p)}>{p.label}</button>
            ))}
            <div className="rp-divider"></div>
            <label className="rp-date-label">Từ</label>
            <input type="date" className="rp-date-input"
              value={fromDate} max={toDate}
              onChange={e => handleFromChange(e.target.value)} />
            <label className="rp-date-label">đến</label>
            <input type="date" className="rp-date-input"
              value={toDate} min={fromDate} max={toInputDate(today)}
              onChange={e => handleToChange(e.target.value)} />
          </div>

          {/* ROW 1: 2 bar charts */}
          <div className="rp-grid-2">

            {/* Tin đăng theo tháng */}
            <div className="adm-card">
              <div className="adm-card-header">
                <h2>🏠 Tin đăng theo tháng</h2>
              </div>
              <div className="rp-legend">
                <span className="rp-dot" style={{ background: '#3b82f6' }}></span>Đã đăng
                <span className="rp-dot" style={{ background: '#22c55e' }}></span>Được duyệt
                <span className="rp-dot" style={{ background: '#ef4444' }}></span>Từ chối
              </div>
              <div className="rp-bar-chart">
                {roomData.length === 0
                  ? <span style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>Không có dữ liệu trong khoảng này</span>
                  : roomData.map(d => (
                    <div key={d.month} className="rp-bar-group">
                      <div className="rp-bars">
                        <div className="rp-bar-wrap">
                          <span className="rp-bar-val">{d.posted}</span>
                          <div className="rp-bar" style={{ height: `${(d.posted   / maxPosted) * 100}%`, background: '#3b82f6' }} title={`Đã đăng: ${d.posted}`}></div>
                        </div>
                        <div className="rp-bar-wrap">
                          <span className="rp-bar-val">{d.approved}</span>
                          <div className="rp-bar" style={{ height: `${(d.approved / maxPosted) * 100}%`, background: '#22c55e' }} title={`Được duyệt: ${d.approved}`}></div>
                        </div>
                        <div className="rp-bar-wrap">
                          <span className="rp-bar-val">{d.rejected}</span>
                          <div className="rp-bar" style={{ height: `${(d.rejected / maxPosted) * 100}%`, background: '#ef4444' }} title={`Từ chối: ${d.rejected}`}></div>
                        </div>
                      </div>
                      <span className="rp-bar-label">{d.month}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Người dùng mới theo tháng */}
            <div className="adm-card">
              <div className="adm-card-header">
                <h2>👥 Người dùng mới theo tháng</h2>
              </div>
              <div className="rp-legend">
                <span className="rp-dot" style={{ background: '#3b82f6' }}></span>Người thuê
                <span className="rp-dot" style={{ background: '#f97316' }}></span>Chủ trọ
              </div>
              <div className="rp-bar-chart">
                {userData.length === 0
                  ? <span style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>Không có dữ liệu trong khoảng này</span>
                  : userData.map(d => (
                    <div key={d.month} className="rp-bar-group">
                      <div className="rp-bars">
                        <div className="rp-bar-wrap">
                          <span className="rp-bar-val">{d.user}</span>
                          <div className="rp-bar" style={{ height: `${(d.user     / maxUsers) * 100}%`, background: '#3b82f6' }} title={`Người thuê: ${d.user}`}></div>
                        </div>
                        <div className="rp-bar-wrap">
                          <span className="rp-bar-val">{d.employer}</span>
                          <div className="rp-bar" style={{ height: `${(d.employer / maxUsers) * 100}%`, background: '#f97316' }} title={`Chủ trọ: ${d.employer}`}></div>
                        </div>
                      </div>
                      <span className="rp-bar-label">{d.month}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* ROW 2: loại phòng + thành phố */}
          <div className="rp-grid-2">

            {/* Phân bổ loại phòng */}
            <div className="adm-card">
              <div className="adm-card-header">
                <h2>🏷 Phân bổ loại phòng</h2>
              </div>
              <div className="rp-type-list">
                {ROOM_TYPES.map(t => (
                  <div key={t.type} className="rp-type-row">
                    <div className="rp-type-info">
                      <span className="rp-type-dot" style={{ background: t.color }}></span>
                      <span className="rp-type-name">{t.type}</span>
                    </div>
                    <div className="rp-type-bar-wrap">
                      <div className="rp-type-bar" style={{ width: `${(t.count / totalTypes) * 100}%`, background: t.color }}></div>
                    </div>
                    <div className="rp-type-meta">
                      <span>{t.count}</span>
                      <span className="rp-type-pct">{Math.round((t.count / totalTypes) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top thành phố */}
            <div className="adm-card">
              <div className="adm-card-header">
                <h2>📍 Tin đăng theo thành phố</h2>
              </div>
              <div className="rp-type-list">
                {TOP_CITIES.map((c, i) => (
                  <div key={c.city} className="rp-type-row">
                    <div className="rp-type-info">
                      <span className="rp-rank">{i + 1}</span>
                      <span className="rp-type-name">{c.city}</span>
                    </div>
                    <div className="rp-type-bar-wrap">
                      <div className="rp-type-bar" style={{ width: `${c.pct}%`, background: '#0ea5e9' }}></div>
                    </div>
                    <div className="rp-type-meta">
                      <span>{c.count}</span>
                      <span className="rp-type-pct">{c.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: top chủ trọ */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h2>🏆 Top chủ trọ hoạt động</h2>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Chủ trọ</th>
                    <th>Số tin đăng</th>
                    <th>Lượt xem</th>
                    <th>Lượt liên hệ</th>
                    <th>Tỉ lệ liên hệ</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_EMPLOYERS.map((e, i) => (
                    <tr key={e.name}>
                      <td>
                        <span className={`rp-rank-badge rp-rank-${i + 1}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td>
                        <div className="au-user-cell">
                          <div className="au-avatar">{e.name.charAt(0)}</div>
                          <span>{e.name}</span>
                        </div>
                      </td>
                      <td><span className="au-rooms-count">{e.rooms} tin</span></td>
                      <td>{e.views.toLocaleString('vi-VN')}</td>
                      <td>{e.contacts}</td>
                      <td>
                        <div className="rp-contact-rate">
                          <div className="rp-contact-bar" style={{ width: `${Math.round((e.contacts / e.views) * 100)}%` }}></div>
                          <span>{Math.round((e.contacts / e.views) * 100)}%</span>
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
    </div>
  );
}
