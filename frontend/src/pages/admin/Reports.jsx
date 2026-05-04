import { useState, useEffect, useCallback } from 'react';
import {
  adminGetReportSummaryApi,
  adminGetRoomsByMonthApi,
  adminGetUsersByMonthApi,
  adminGetRoomTypesApi,
  adminGetTopCitiesApi,
  adminGetTopEmployersApi,
} from '../../api/admin';
import AdminLayout from '../../components/AdminLayout';
import './Dashboard.css';
import './Reports.css';

const PRESETS = [
  { label: '30 ngày', days: 30 },
  { label: '3 tháng', days: 90 },
  { label: '6 tháng', days: 180 },
];

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function AdminReports({ user, onLogout }) {
  const today     = new Date();
  const default6m = new Date(today);
  default6m.setMonth(default6m.getMonth() - 6);

  const [fromDate,     setFromDate]     = useState(toInputDate(default6m));
  const [toDate,       setToDate]       = useState(toInputDate(today));
  const [activePreset, setActivePreset] = useState('6 tháng');

  const [summary,      setSummary]      = useState(null);
  const [roomsByMonth, setRoomsByMonth] = useState([]);
  const [usersByMonth, setUsersByMonth] = useState([]);
  const [roomTypes,    setRoomTypes]    = useState([]);
  const [topCities,    setTopCities]    = useState([]);
  const [topEmployers, setTopEmployers] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      adminGetReportSummaryApi(),
      adminGetRoomTypesApi(),
      adminGetTopCitiesApi(),
      adminGetTopEmployersApi(),
    ]).then(([sum, types, cities, employers]) => {
      setSummary(sum);
      setRoomTypes(types.data);
      setTopCities(cities.data);
      setTopEmployers(employers.data);
    }).catch(console.error);
  }, []);

  const fetchCharts = useCallback(async () => {
    setChartLoading(true);
    try {
      const [rooms, users] = await Promise.all([
        adminGetRoomsByMonthApi(fromDate, toDate),
        adminGetUsersByMonthApi(fromDate, toDate),
      ]);
      setRoomsByMonth(rooms.data);
      setUsersByMonth(users.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChartLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);

  const applyPreset = (preset) => {
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - preset.days);
    setFromDate(toInputDate(start));
    setToDate(toInputDate(end));
    setActivePreset(preset.label);
  };

  const maxPosted  = Math.max(...roomsByMonth.map(d => d.posted), 1);
  const maxUsers   = Math.max(...usersByMonth.map(d => d.user + d.employer), 1);
  const totalTypes = roomTypes.reduce((s, t) => s + t.count, 0);

  const SUMMARY_CARDS = summary ? [
    { icon: '🏠', label: 'Tổng tin đăng',   value: summary.totalRooms?.toLocaleString('vi-VN'),    sub: `+${summary.newRoomsMonth} tháng này`, color: 'blue'   },
    { icon: '👥', label: 'Tổng người dùng', value: summary.totalUsers?.toLocaleString('vi-VN'),    sub: `+${summary.newUsersMonth} tháng này`, color: 'green'  },
    { icon: '👁', label: 'Lượt xem',        value: summary.totalViews?.toLocaleString('vi-VN'),    sub: 'Tổng cộng',                           color: 'purple' },
    { icon: '📞', label: 'Lượt liên hệ',    value: summary.totalContacts?.toLocaleString('vi-VN'), sub: 'Tổng cộng',                           color: 'orange' },
  ] : [];

  const emptyChart = (
    <span style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 'auto' }}>
      {chartLoading ? 'Dang tai...' : 'Khong co du lieu trong khoang nay'}
    </span>
  );

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Báo cáo thống kê" subtitle="Tổng hợp số liệu hoạt động hệ thống">
      {/* SUMMARY */}
      <div className="adm-stats-grid" style={{ marginBottom: 24 }}>
        {SUMMARY_CARDS.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="adm-stat-card adm-stat-blue rp-skeleton"></div>
            ))
          : SUMMARY_CARDS.map(s => (
              <div key={s.label} className={`adm-stat-card adm-stat-${s.color}`}>
                <div className="adm-stat-top">
                  <span className="adm-stat-icon">{s.icon}</span>
                  <strong className="adm-stat-value">{s.value}</strong>
                </div>
                <p className="adm-stat-label">{s.label}</p>
                <span className="adm-stat-sub">{s.sub}</span>
              </div>
            ))
        }
      </div>

      {/* DATE RANGE */}
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
          onChange={e => { setFromDate(e.target.value); setActivePreset(''); }} />
        <label className="rp-date-label">đến</label>
        <input type="date" className="rp-date-input"
          value={toDate} min={fromDate} max={toInputDate(today)}
          onChange={e => { setToDate(e.target.value); setActivePreset(''); }} />
      </div>

      {/* CHARTS ROW */}
      <div className="rp-grid-2">
        <div className="adm-card">
          <div className="adm-card-header"><h2>🏠 Tin đăng theo tháng</h2></div>
          <div className="rp-legend">
            <span className="rp-dot" style={{ background: '#3b82f6' }}></span>Đã đăng
            <span className="rp-dot" style={{ background: '#22c55e' }}></span>Được duyệt
            <span className="rp-dot" style={{ background: '#ef4444' }}></span>Từ chối
          </div>
          <div className="rp-bar-chart">
            {roomsByMonth.length === 0 ? emptyChart : roomsByMonth.map(d => (
              <div key={d.month} className="rp-bar-group">
                <div className="rp-bars">
                  <div className="rp-bar-wrap">
                    <span className="rp-bar-val">{d.posted}</span>
                    <div className="rp-bar" style={{ height: `${(d.posted / maxPosted) * 100}%`, background: '#3b82f6' }}></div>
                  </div>
                  <div className="rp-bar-wrap">
                    <span className="rp-bar-val">{d.approved}</span>
                    <div className="rp-bar" style={{ height: `${(d.approved / maxPosted) * 100}%`, background: '#22c55e' }}></div>
                  </div>
                  <div className="rp-bar-wrap">
                    <span className="rp-bar-val">{d.rejected}</span>
                    <div className="rp-bar" style={{ height: `${(d.rejected / maxPosted) * 100}%`, background: '#ef4444' }}></div>
                  </div>
                </div>
                <span className="rp-bar-label">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-header"><h2>👥 Người dùng mới theo tháng</h2></div>
          <div className="rp-legend">
            <span className="rp-dot" style={{ background: '#3b82f6' }}></span>Người thuê
            <span className="rp-dot" style={{ background: '#f97316' }}></span>Chủ trọ
          </div>
          <div className="rp-bar-chart">
            {usersByMonth.length === 0 ? emptyChart : usersByMonth.map(d => (
              <div key={d.month} className="rp-bar-group">
                <div className="rp-bars">
                  <div className="rp-bar-wrap">
                    <span className="rp-bar-val">{d.user}</span>
                    <div className="rp-bar" style={{ height: `${(d.user / maxUsers) * 100}%`, background: '#3b82f6' }}></div>
                  </div>
                  <div className="rp-bar-wrap">
                    <span className="rp-bar-val">{d.employer}</span>
                    <div className="rp-bar" style={{ height: `${(d.employer / maxUsers) * 100}%`, background: '#f97316' }}></div>
                  </div>
                </div>
                <span className="rp-bar-label">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TYPE + CITY */}
      <div className="rp-grid-2">
        <div className="adm-card">
          <div className="adm-card-header"><h2>🏷 Phân bổ loại phòng</h2></div>
          <div className="rp-type-list">
            {roomTypes.map(t => (
              <div key={t.type} className="rp-type-row">
                <div className="rp-type-info">
                  <span className="rp-type-dot" style={{ background: t.color }}></span>
                  <span className="rp-type-name">{t.type}</span>
                </div>
                <div className="rp-type-bar-wrap">
                  <div className="rp-type-bar" style={{ width: `${totalTypes ? (t.count / totalTypes) * 100 : 0}%`, background: t.color }}></div>
                </div>
                <div className="rp-type-meta">
                  <span>{t.count}</span>
                  <span className="rp-type-pct">{totalTypes ? Math.round((t.count / totalTypes) * 100) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-header"><h2>📍 Tin đăng theo thành phố</h2></div>
          <div className="rp-type-list">
            {topCities.map((c, i) => (
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

      {/* TOP EMPLOYERS */}
      <div className="adm-card">
        <div className="adm-card-header"><h2>🏆 Top chủ trọ hoạt động</h2></div>
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
              {topEmployers.length === 0 && (
                <tr><td colSpan={6} className="ar-empty">Đang tải...</td></tr>
              )}
              {topEmployers.map((e, i) => (
                <tr key={e.name}>
                  <td><span className="rp-rank-badge">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span></td>
                  <td>
                    <div className="au-user-cell">
                      <div className="au-avatar">{e.name?.charAt(0)}</div>
                      <span>{e.name}</span>
                    </div>
                  </td>
                  <td><span className="au-rooms-count">{e.rooms} tin</span></td>
                  <td>{Number(e.views).toLocaleString('vi-VN')}</td>
                  <td>{e.contacts}</td>
                  <td>
                    <div className="rp-contact-rate">
                      <div className="rp-contact-bar" style={{ width: `${e.views > 0 ? Math.round((e.contacts / e.views) * 100) : 0}%` }}></div>
                      <span>{e.views > 0 ? Math.round((e.contacts / e.views) * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
