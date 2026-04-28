const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Tất cả route đều yêu cầu role admin
router.use(auth(['admin']));

function timeAgo(date) {
  const diff  = Date.now() - new Date(date).getTime() + 7 * 3600000;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'Vừa xong';
  if (mins  < 60)  return `${mins} phút trước`;
  if (hours < 24)  return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

function formatRoom(r) {
  return {
    id:          r.ma_phong,
    title:       r.tieu_de,
    type:        r.loai_phong,
    city:        r.tinh_thanh,
    district:    r.quan_huyen,
    address:     r.dia_chi,
    price:       r.gia_thue,
    area:        r.dien_tich,
    status:      r.trang_thai,
    available:   r.con_phong,
    featured:    r.noi_bat,
    views:       r.luot_xem,
    contacts:    r.so_lien_he,
    image:       r.anh_bia || r.anh_dau_tien || null,
    employer:    r.ho_ten,
    employerId:  r.ma_chu_tro,
    submittedAt: r.ngay_tao,
    postedAt:    timeAgo(r.ngay_tao),
  };
}

// ─────────────────────────────────────────────
// GET /api/admin/dashboard
// Tổng quan: stats + pending rooms + recent users
// ─────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().execute('sp_AdminTongQuan');

    const s = result.recordsets[0][0];
    const stats = {
      totalUsers:    s.tong_nguoi_dung,
      newUsersToday: s.nguoi_dung_hom_nay,
      totalRooms:    s.tong_tin_dang,
      newRoomsToday: s.tin_dang_hom_nay,
      pending:       s.cho_duyet,
      rejected7days: s.tu_choi_7_ngay,
    };

    const pendingRooms = result.recordsets[1].map(r => ({
      id:          r.ma_phong,
      title:       r.tieu_de,
      type:        r.loai_phong,
      city:        r.tinh_thanh,
      price:       r.gia_thue,
      employer:    r.ten_chu_tro,
      submittedAt: timeAgo(r.ngay_tao),
    }));

    const recentUsers = result.recordsets[2].map(u => ({
      id:       u.ma_nd,
      name:     u.ho_ten,
      username: u.tai_khoan,
      role:     u.vai_tro,
      joinedAt: timeAgo(u.ngay_tao),
    }));

    return res.json({ stats, pendingRooms, recentUsers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/rooms
// Query: status, keyword, city, type, page
// ─────────────────────────────────────────────
router.get('/rooms', async (req, res) => {
  const { status, keyword, city, type, page = 1 } = req.query;
  const limit  = 10;
  const offset = (parseInt(page) - 1) * limit;

  try {
    await poolConnect;

    const result = await pool.request()
      .input('trang_thai', sql.NVarChar(20),  status  || null)
      .input('tu_khoa',    sql.NVarChar(200), keyword || null)
      .input('tinh_thanh', sql.NVarChar(100), city    || null)
      .input('loai_phong', sql.NVarChar(50),  type    || null)
      .input('gioi_han',   sql.Int,           limit)
      .input('bo_qua',     sql.Int,           offset)
      .execute('sp_AdminLayDanhSachPhong');

    const rooms = result.recordset.map(formatRoom);
    const total = result.recordset[0]?.tong_so ?? 0;

    return res.json({ rooms, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/rooms/stats
// Trả về số lượng theo từng trạng thái
// ─────────────────────────────────────────────
router.get('/rooms/stats', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().execute('sp_AdminThongKeTinDang');
    const s = result.recordset[0];
    return res.json({
      all:      s.tong_so,
      pending:  s.cho_duyet,
      approved: s.da_duyet,
      rejected: s.tu_choi,
      paused:   s.tam_dung,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/rooms/:id
// Chi tiết một tin đăng
// ─────────────────────────────────────────────
router.get('/rooms/:id', async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  try {
    await poolConnect;
    const [roomRes, imgRes, amenRes] = await Promise.all([
      pool.request().input('ma_phong', sql.Int, ma_phong).execute('sp_AdminChiTietPhong'),
      pool.request().input('ma_phong', sql.Int, ma_phong).execute('sp_LayAnhPhong'),
      pool.request().input('ma_phong', sql.Int, ma_phong).execute('sp_LayTienIchPhong'),
    ]);

    if (!roomRes.recordset.length)
      return res.status(404).json({ message: 'Không tìm thấy tin đăng' });

    const room = formatRoom(roomRes.recordset[0]);
    room.description  = roomRes.recordset[0].mo_ta;
    room.deposit      = roomRes.recordset[0].tien_coc;
    room.contactName  = roomRes.recordset[0].ten_lien_he;
    room.contactPhone = roomRes.recordset[0].sdt_lien_he;
    room.contactEmail = roomRes.recordset[0].email_lien_he;
    room.images       = imgRes.recordset.map(i => i.duong_dan);
    room.amenities    = amenRes.recordset.map(a => ({ key: a.ma_khoa, label: a.ten_hien_thi, icon: a.bieu_tuong }));

    return res.json({ room });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/rooms/:id/status
// Body: { status: 'approved' | 'rejected' | 'paused' }
// ─────────────────────────────────────────────
router.patch('/rooms/:id/status', async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  const { status } = req.body;
  const allowed = ['approved', 'rejected', 'paused', 'pending'];

  if (!allowed.includes(status))
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

  try {
    await poolConnect;
    await pool.request()
      .input('ma_phong',   sql.Int,          ma_phong)
      .input('trang_thai', sql.NVarChar(20), status)
      .input('ma_admin',   sql.Int,          req.user.id)
      .execute('sp_AdminCapNhatTrangThaiPhong');

    return res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/rooms/:id
// Xóa tin đăng (admin có quyền xóa bất kỳ)
// ─────────────────────────────────────────────
router.delete('/rooms/:id', async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  try {
    await poolConnect;
    await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .execute('sp_AdminXoaPhong');

    return res.json({ message: 'Đã xóa tin đăng' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

function formatUser(u) {
  return {
    id:       u.ma_nd,
    name:     u.ho_ten,
    username: u.tai_khoan,
    phone:    u.dien_thoai,
    role:     u.vai_tro,
    active:   u.con_hoat_dong,
    avatar:   u.anh_dai_dien || null,
    rooms:    u.so_tin ?? 0,
    joinedAt: u.ngay_tao,
  };
}

// ─────────────────────────────────────────────
// GET /api/admin/users
// Query: role, keyword, page
// ─────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { role, keyword, page = 1 } = req.query;
  const limit  = 10;
  const offset = (parseInt(page) - 1) * limit;

  try {
    await poolConnect;
    const result = await pool.request()
      .input('vai_tro',  sql.NVarChar(10),  role    || null)
      .input('tu_khoa',  sql.NVarChar(200), keyword || null)
      .input('gioi_han', sql.Int,           limit)
      .input('bo_qua',   sql.Int,           offset)
      .execute('sp_AdminLayDanhSachNguoiDung');

    const users = result.recordset.map(formatUser);
    const total = result.recordset[0]?.tong_so ?? 0;

    return res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/users/stats
// ─────────────────────────────────────────────
router.get('/users/stats', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().execute('sp_AdminThongKeNguoiDung');
    const s = result.recordset[0];
    return res.json({
      all:      s.tong_so,
      user:     s.nguoi_thue,
      employer: s.chu_tro,
      admin:    s.quan_tri,
      active:   s.hoat_dong,
      locked:   s.bi_khoa,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/users/:id
// ─────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  const ma_nd = parseInt(req.params.id);
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, ma_nd)
      .execute('sp_AdminChiTietNguoiDung');

    if (!result.recordset.length)
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    return res.json({ user: formatUser(result.recordset[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:id/status
// Body: { active: true | false }
// ─────────────────────────────────────────────
router.patch('/users/:id/status', async (req, res) => {
  const ma_nd = parseInt(req.params.id);
  const { active } = req.body;

  if (typeof active !== 'boolean')
    return res.status(400).json({ message: 'Giá trị active không hợp lệ' });

  // Không cho khóa chính mình
  if (ma_nd === req.user.id)
    return res.status(400).json({ message: 'Không thể khóa tài khoản của chính mình' });

  try {
    await poolConnect;
    await pool.request()
      .input('ma_nd',        sql.Int, ma_nd)
      .input('con_hoat_dong', sql.Bit, active ? 1 : 0)
      .execute('sp_AdminCapNhatTrangThaiNguoiDung');

    return res.json({ message: active ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /api/admin/reports/summary
// Tổng quan: tổng tin, tổng user, lượt xem, lượt liên hệ
// ─────────────────────────────────────────────
router.get('/reports/summary', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().execute('sp_AdminBaoCaoTongQuan');
    const s = result.recordset[0];
    return res.json({
      totalRooms:    s.tong_tin,
      totalUsers:    s.tong_nguoi_dung,
      totalViews:    s.tong_luot_xem,
      totalContacts: s.tong_lien_he,
      newRoomsMonth: s.tin_moi_thang,
      newUsersMonth: s.user_moi_thang,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/reports/rooms-by-month?from=&to=
// Tin đăng theo tháng trong khoảng ngày
// ─────────────────────────────────────────────
router.get('/reports/rooms-by-month', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ message: 'Thiếu from/to' });
  try {
    await poolConnect;
    const result = await pool.request()
      .input('tu_ngay', sql.Date, from)
      .input('den_ngay', sql.Date, to)
      .execute('sp_AdminThongKeTinDangTheoThang');

    return res.json({
      data: result.recordset.map(r => ({
        month:    r.thang_label,
        date:     r.thang_date,
        posted:   r.tong_dang,
        approved: r.duoc_duyet,
        rejected: r.tu_choi,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/reports/users-by-month?from=&to=
// Người dùng mới theo tháng
// ─────────────────────────────────────────────
router.get('/reports/users-by-month', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ message: 'Thiếu from/to' });
  try {
    await poolConnect;
    const result = await pool.request()
      .input('tu_ngay',  sql.Date, from)
      .input('den_ngay', sql.Date, to)
      .execute('sp_AdminThongKeNguoiDungTheoThang');

    return res.json({
      data: result.recordset.map(r => ({
        month:    r.thang_label,
        date:     r.thang_date,
        user:     r.nguoi_thue,
        employer: r.chu_tro,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/reports/room-types
// Phân bổ loại phòng
// ─────────────────────────────────────────────
router.get('/reports/room-types', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().execute('sp_AdminThongKeLoaiPhong');
    const TYPE_COLORS = {
      'Phòng trọ':      '#3b82f6',
      'Chung cư mini':  '#8b5cf6',
      'Studio':         '#06b6d4',
      'Nhà nguyên căn': '#f97316',
      'Căn hộ dịch vụ': '#ec4899',
      'Ký túc xá':      '#84cc16',
    };
    return res.json({
      data: result.recordset.map(r => ({
        type:  r.loai_phong,
        count: r.so_luong,
        color: TYPE_COLORS[r.loai_phong] || '#94a3b8',
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/reports/top-cities
// Top thành phố có nhiều tin nhất
// ─────────────────────────────────────────────
router.get('/reports/top-cities', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('gioi_han', sql.Int, 6)
      .execute('sp_AdminTopThanhPho');

    const total = result.recordset.reduce((s, r) => s + r.so_luong, 0);
    return res.json({
      data: result.recordset.map(r => ({
        city:  r.tinh_thanh,
        count: r.so_luong,
        pct:   total > 0 ? Math.round((r.so_luong / total) * 100) : 0,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/reports/top-employers
// Top chủ trọ theo lượt xem
// ─────────────────────────────────────────────
router.get('/reports/top-employers', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('gioi_han', sql.Int, 5)
      .execute('sp_AdminTopChuTro');

    return res.json({
      data: result.recordset.map(r => ({
        name:     r.ho_ten,
        rooms:    r.so_tin,
        views:    r.tong_luot_xem,
        contacts: r.tong_lien_he,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});
