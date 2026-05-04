import { useState, useEffect, useCallback } from 'react';
import {
  adminGetRoomsApi,
  adminGetRoomStatsApi,
  adminGetRoomDetailApi,
  adminUpdateRoomStatusApi,
  adminDeleteRoomApi,
} from '../../api/admin';
import AdminLayout from '../../components/AdminLayout';
import './Dashboard.css';
import './Rooms.css';

const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'pending',  label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
  { key: 'paused',   label: 'Tạm dừng' },
];

const STATUS_LABEL = {
  pending:  'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  paused:   'Tạm dừng',
};

export default function AdminRooms({ user, onLogout }) {
  const [tab,     setTab]     = useState('all');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);

  const [rooms,      setRooms]      = useState([]);
  const [stats,      setStats]      = useState({ all: 0, pending: 0, approved: 0, rejected: 0, paused: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (tab !== 'all') params.status  = tab;
      if (search.trim()) params.keyword = search.trim();
      const [listData, statsData] = await Promise.all([
        adminGetRoomsApi(params),
        adminGetRoomStatsApi(),
      ]);
      setRooms(listData.rooms);
      setTotalPages(listData.totalPages);
      setStats(statsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search, page]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const openDetail = async (room) => {
    setDetail(room);
    setDetailLoading(true);
    try {
      const { room: full } = await adminGetRoomDetailApi(room.id);
      setDetail(full);
    } catch { /* giữ data cơ bản */ }
    finally { setDetailLoading(false); }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await adminUpdateRoomStatusApi(id, status);
      await fetchRooms();
      if (detail?.id === id) setDetail(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const deleteRoom = async (id) => {
    if (!confirm('Xác nhận xóa tin đăng này?')) return;
    setActionLoading(p => ({ ...p, [id]: true }));
    try {
      await adminDeleteRoomApi(id);
      await fetchRooms();
      if (detail?.id === id) setDetail(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(p => ({ ...p, [id]: false }));
    }
  };

  return (
    <AdminLayout user={user} onLogout={onLogout} title="Quản lý tin đăng" subtitle="Duyệt và quản lý tất cả tin đăng phòng trọ">
      {/* STATS ROW */}
      <div className="ar-stats-row">
        {TABS.map(t => (
          <div key={t.key} className={`ar-stat-pill ar-stat-${t.key}`}>
            <span className="ar-stat-num">{stats[t.key] ?? 0}</span>
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
                <span className="ar-tab-count">{stats[t.key] ?? 0}</span>
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

        {error && <p className="ar-error">⚠️ {error}</p>}

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
              {loading && (
                <tr><td colSpan={9} className="ar-empty">⏳ Đang tải...</td></tr>
              )}
              {!loading && rooms.length === 0 && (
                <tr><td colSpan={9} className="ar-empty">Không có tin đăng nào</td></tr>
              )}
              {!loading && rooms.map((r, i) => (
                <tr key={r.id}>
                  <td className="ar-td-idx">{(page - 1) * 10 + i + 1}</td>
                  <td className="adm-td-title">{r.title}</td>
                  <td>{r.employer}</td>
                  <td><span className="adm-type-badge">{r.type}</span></td>
                  <td>{r.city}</td>
                  <td className="ar-td-price">{Number(r.price).toLocaleString('vi-VN')}đ</td>
                  <td className="adm-td-time">{r.postedAt}</td>
                  <td><span className={`ar-status ar-status-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td>
                    <div className="adm-action-btns">
                      <button className="ar-btn-detail" onClick={() => openDetail(r)}
                        disabled={actionLoading[r.id]}>👁</button>
                      {r.status === 'pending' && (
                        <>
                          <button className="adm-btn-approve"
                            disabled={actionLoading[r.id]}
                            onClick={() => updateStatus(r.id, 'approved')}>✓</button>
                          <button className="adm-btn-reject"
                            disabled={actionLoading[r.id]}
                            onClick={() => updateStatus(r.id, 'rejected')}>✕</button>
                        </>
                      )}
                      <button className="ar-btn-delete"
                        disabled={actionLoading[r.id]}
                        onClick={() => deleteRoom(r.id)}>🗑</button>
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

      {/* DETAIL MODAL */}
      {detail && (
        <div className="ar-overlay" onClick={() => setDetail(null)}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <h2>Chi tiết tin đăng</h2>
              <button className="ar-modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="ar-modal-body">
              {detailLoading ? (
                <p className="ar-empty">⏳ Đang tải...</p>
              ) : (
                <>
                  <div className="ar-modal-img">
                    {detail.image
                      ? <img src={detail.image} alt={detail.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : '🏠'}
                  </div>
                  <div className="ar-modal-rows">
                    <div className="ar-modal-row"><span>Tiêu đề</span><strong>{detail.title}</strong></div>
                    <div className="ar-modal-row"><span>Chủ trọ</span><strong>{detail.employer}</strong></div>
                    <div className="ar-modal-row"><span>Loại phòng</span><strong>{detail.type}</strong></div>
                    <div className="ar-modal-row"><span>Địa chỉ</span><strong>{detail.address}</strong></div>
                    <div className="ar-modal-row"><span>Thành phố</span><strong>{detail.city}</strong></div>
                    <div className="ar-modal-row"><span>Giá/tháng</span><strong className="ar-modal-price">{Number(detail.price).toLocaleString('vi-VN')}đ</strong></div>
                    {detail.deposit && <div className="ar-modal-row"><span>Tiền cọc</span><strong>{Number(detail.deposit).toLocaleString('vi-VN')}đ</strong></div>}
                    <div className="ar-modal-row"><span>Diện tích</span><strong>{detail.area} m²</strong></div>
                    {detail.contactPhone && <div className="ar-modal-row"><span>Liên hệ</span><strong>{detail.contactName} — {detail.contactPhone}</strong></div>}
                    <div className="ar-modal-row">
                      <span>Trạng thái</span>
                      <span className={`ar-status ar-status-${detail.status}`}>{STATUS_LABEL[detail.status]}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!detailLoading && (
              <div className="ar-modal-footer">
                {detail.status === 'pending' && (
                  <>
                    <button className="adm-btn-reject ar-modal-btn"
                      onClick={() => updateStatus(detail.id, 'rejected')}>✕ Từ chối</button>
                    <button className="adm-btn-approve ar-modal-btn"
                      onClick={() => updateStatus(detail.id, 'approved')}>✓ Duyệt tin</button>
                  </>
                )}
                {detail.status === 'approved' && (
                  <button className="ar-btn-pause ar-modal-btn"
                    onClick={() => updateStatus(detail.id, 'paused')}>⏸ Tạm dừng</button>
                )}
                {detail.status === 'paused' && (
                  <button className="adm-btn-approve ar-modal-btn"
                    onClick={() => updateStatus(detail.id, 'approved')}>▶ Kích hoạt lại</button>
                )}
                <button className="ar-btn-delete-modal ar-modal-btn"
                  onClick={() => deleteRoom(detail.id)}>🗑 Xóa</button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
