import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import EmployerNavbar from '../../components/EmployerNavbar';
import { getAnalyticsApi } from '../../api/employer';
import './Analytics.css';

const FALLBACK = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop';

export default function Analytics({ user, onLogout }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('30d'); // '7d' | '30d'
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'employer') { navigate('/login'); return; }
    getAnalyticsApi()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const chartData = data
    ? (period === '7d' ? data.chartData.slice(-7) : data.chartData)
    : [];

  // Sắp xếp phòng theo lượt xem giảm dần
  const sortedRooms = data
    ? [...data.rooms].sort((a, b) => b.views - a.views)
    : [];

  const maxViews = sortedRooms[0]?.views || 1;

  return (
    <div className="an-wrap">
      <EmployerNavbar user={user} onLogout={onLogout} />

      <div className="an-body">
        <div className="an-header">
          <div>
            <h1>Thống kê & Phân tích</h1>
            <p>Theo dõi hiệu quả tin đăng của bạn</p>
          </div>
        </div>

        {loading ? (
          <div className="an-loading"><div className="an-spinner" /><p>Đang tải...</p></div>
        ) : !data ? (
          <div className="an-empty"><p>Không thể tải dữ liệu</p></div>
        ) : (
          <>
            {/* STATS CARDS */}
            <div className="an-stats">
              <div className="an-stat-card blue">
                <span className="an-stat-icon">👁️</span>
                <div>
                  <strong>{data.stats.totalViews.toLocaleString('vi-VN')}</strong>
                  <p>Tổng lượt xem</p>
                </div>
              </div>
              <div className="an-stat-card green">
                <span className="an-stat-icon">📞</span>
                <div>
                  <strong>{data.stats.totalContacts.toLocaleString('vi-VN')}</strong>
                  <p>Tổng liên hệ</p>
                </div>
              </div>
              <div className="an-stat-card red">
                <span className="an-stat-icon">❤️</span>
                <div>
                  <strong>{data.stats.totalSaved.toLocaleString('vi-VN')}</strong>
                  <p>Lượt lưu tin</p>
                </div>
              </div>
              <div className="an-stat-card purple">
                <span className="an-stat-icon">🏠</span>
                <div>
                  <strong>{data.stats.activeRooms}/{data.stats.totalRooms}</strong>
                  <p>Tin đang hoạt động</p>
                </div>
              </div>
            </div>

            {/* CHART */}
            <div className="an-card">
              <div className="an-card-header">
                <h2>Lượt xem & Liên hệ theo ngày</h2>
                <div className="an-period-btns">
                  <button className={period === '7d'  ? 'active' : ''} onClick={() => setPeriod('7d')}>7 ngày</button>
                  <button className={period === '30d' ? 'active' : ''} onClick={() => setPeriod('30d')}>30 ngày</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={period === '30d' ? 4 : 0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="views"    name="Lượt xem" stroke="#2563eb" fill="url(#gViews)"    strokeWidth={2} />
                  <Area type="monotone" dataKey="contacts" name="Liên hệ"  stroke="#22c55e" fill="url(#gContacts)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="an-two-col">
              {/* SO SÁNH TIN ĐĂNG */}
              <div className="an-card">
                <div className="an-card-header">
                  <h2>So sánh hiệu quả tin đăng</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sortedRooms.slice(0, 8).map(r => ({
                    name: r.title.length > 18 ? r.title.slice(0, 18) + '…' : r.title,
                    'Lượt xem': r.views,
                    'Liên hệ': r.contacts,
                    'Lưu tin': r.saved,
                  }))} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Lượt xem" fill="#2563eb" radius={[4,4,0,0]} />
                    <Bar dataKey="Liên hệ"  fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="Lưu tin"  fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* GỢI Ý CẢI THIỆN */}
              <div className="an-card">
                <div className="an-card-header">
                  <h2>Gợi ý cải thiện</h2>
                </div>
                <div className="an-suggestions">
                  {data.suggestions.map((s, i) => (
                    <div key={i} className={`an-suggestion ${s.type}`}>
                      <span className="an-sug-icon">
                        {s.type === 'warning' ? '⚠️' : s.type === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <p>{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BẢNG XẾP HẠNG TIN ĐĂNG */}
            <div className="an-card">
              <div className="an-card-header">
                <h2>Xếp hạng tin đăng theo lượt xem</h2>
              </div>
              <div className="an-room-table">
                {sortedRooms.map((room, idx) => (
                  <div key={room.id} className="an-room-row">
                    <span className={`an-rank ${idx < 3 ? 'top' : ''}`}>#{idx + 1}</span>
                    <img src={room.image || FALLBACK} alt={room.title} className="an-room-img"
                      onError={e => { e.target.src = FALLBACK; }} />
                    <div className="an-room-info">
                      <p className="an-room-title">{room.title}</p>
                      <div className="an-room-bar-wrap">
                        <div className="an-room-bar" style={{ width: `${(room.views / maxViews) * 100}%` }} />
                      </div>
                    </div>
                    <div className="an-room-metrics">
                      <span>👁️ {room.views}</span>
                      <span>📞 {room.contacts}</span>
                      <span>❤️ {room.saved}</span>
                    </div>
                    <Link to={`/employer/rooms/${room.id}`} className="an-room-link">Chi tiết →</Link>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
