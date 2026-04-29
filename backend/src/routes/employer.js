const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime() + 7 * 3600000;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'Vừa xong';
  if (mins  < 60)  return `${mins} phút trước`;
  if (hours < 24)  return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

// GET /api/employer/dashboard
router.get('/dashboard', auth(['employer', 'admin']), async (req, res) => {
  const ma_nd = req.user.id;
  try {
    await poolConnect;
    const [statsRes, roomsRes, notiRes, goiRes] = await Promise.all([
      pool.request().input('ma_nd', sql.Int, ma_nd).execute('sp_ThongKeChuTro'),
      pool.request().input('ma_nd', sql.Int, ma_nd).input('gioi_han', sql.Int, 5).input('bo_qua', sql.Int, 0).execute('sp_LayPhongChuTro'),
      pool.request().input('ma_nd', sql.Int, ma_nd).input('gioi_han', sql.Int, 10).execute('sp_LayThongBao'),
      pool.request().input('ma_nd', sql.Int, ma_nd).execute('sp_LayGoiHienTai'),
    ]);

    const s = statsRes.recordset[0];
    const rooms = roomsRes.recordset.map(r => ({
      id:        r.ma_phong,
      title:     r.tieu_de,
      type:      r.loai_phong,
      city:      r.tinh_thanh,
      address:   r.dia_chi,
      price:     r.gia_thue,
      area:      r.dien_tich,
      available: r.con_phong,
      featured:  r.noi_bat,
      status:    r.trang_thai,
      views:     r.luot_xem,
      contacts:  r.so_lien_he,
      saved:     r.luot_luu,
      image:     r.anh_bia || r.anh_dau_tien || null,
      postedAt:  timeAgo(r.ngay_tao),
    }));

    const notifications = notiRes.recordset.map(n => ({
      id:      n.ma_tb,
      icon:    n.bieu_tuong || '🔔',
      text:    n.noi_dung,
      unread:  !n.da_doc,
      time:    timeAgo(n.ngay_tao),
    }));

    const goi = goiRes.recordset[0] || null;

    return res.json({
      stats: {
        tong_tin:      s.tong_tin,
        tin_dang:      s.tin_dang,
        cho_duyet:     s.cho_duyet,
        bi_tu_choi:    s.bi_tu_choi,
        tam_dung:      s.tam_dung,
        tong_luot_xem: s.tong_luot_xem,
        tong_lien_he:  s.tong_lien_he,
        tong_luu_tin:  s.tong_luu_tin,
      },
      rooms,
      notifications,
      goi: goi ? {
        tenGoi:      goi.ten_goi,
        hetHan:      goi.het_han,
        ngayConLai:  goi.ngay_con_lai,
        gioi_han_tin: goi.gioi_han_tin,
        conHieuLuc:  goi.con_hieu_luc,
      } : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/employer/rooms  — đăng tin mới
router.post('/rooms', auth(['employer', 'admin']), async (req, res) => {
  const ma_nd = req.user.id;
  const {
    title, type, city, district, address,
    price, deposit, area, description,
    contactName, contactPhone, contactEmail, showPhone,
    amenities = [],   // string[]  e.g. ['wifi','ac']
    images    = [],   // string[]  base64 or URL
  } = req.body;

  // Basic validation
  if (!title || !type || !city || !address || !price || !area || !contactName || !contactPhone)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

  try {
    await poolConnect;

    // 1. Insert phong_tro
    const insertRes = await pool.request()
      .input('ma_chu_tro',    sql.Int,          ma_nd)
      .input('tieu_de',       sql.NVarChar(200), title)
      .input('loai_phong',    sql.NVarChar(50),  type)
      .input('tinh_thanh',    sql.NVarChar(100), city)
      .input('quan_huyen',    sql.NVarChar(100), district || null)
      .input('dia_chi',       sql.NVarChar(300), address)
      .input('gia_thue',      sql.Decimal(12,0), parseFloat(price))
      .input('tien_coc',      sql.Decimal(12,0), deposit ? parseFloat(deposit) : null)
      .input('dien_tich',     sql.Decimal(6,1),  parseFloat(area))
      .input('mo_ta',         sql.NVarChar(sql.MAX), description || null)
      .input('ten_lien_he',   sql.NVarChar(100), contactName)
      .input('sdt_lien_he',   sql.NVarChar(20),  contactPhone)
      .input('email_lien_he', sql.NVarChar(150), contactEmail || null)
      .input('hien_sdt',      sql.Bit,           showPhone ? 1 : 0)
      .execute('sp_DangTinPhong');

    const ma_phong = insertRes.recordset[0].ma_phong;

    // 2. Insert ảnh
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img) continue;
      try {
        await pool.request()
          .input('ma_phong',   sql.Int,               ma_phong)
          .input('duong_dan',  sql.NVarChar(sql.MAX),  img)
          .input('la_anh_bia', sql.Bit,                i === 0 ? 1 : 0)
          .input('thu_tu',     sql.Int,                i)
          .execute('sp_ThemAnhPhong');
      } catch (imgErr) {
        console.error('Lỗi insert ảnh:', imgErr.message);
      }
    }

    // 3. Insert tiện ích
    for (const key of amenities) {
      await pool.request()
        .input('ma_phong', sql.Int,          ma_phong)
        .input('ma_khoa',  sql.NVarChar(50), key)
        .execute('sp_ThemTienIchPhong');
    }

    return res.status(201).json({ message: 'Đăng tin thành công, đang chờ duyệt', roomId: ma_phong });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/employer/rooms — danh sách phòng của chủ trọ
router.get('/rooms', auth(['employer', 'admin']), async (req, res) => {
  const ma_nd = req.user.id;
  const { status } = req.query; // 'pending' | 'approved' | 'rejected' | 'paused' | undefined
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd',      sql.Int,          ma_nd)
      .input('trang_thai', sql.NVarChar(20), status || null)
      .execute('sp_LayPhongChuTroFilter');

    const rooms = result.recordset.map(r => ({
      id:        r.ma_phong,
      title:     r.tieu_de,
      type:      r.loai_phong,
      city:      r.tinh_thanh,
      address:   r.dia_chi,
      price:     r.gia_thue,
      area:      r.dien_tich,
      available: r.con_phong,
      featured:  r.noi_bat,
      status:    r.trang_thai,
      views:     r.luot_xem,
      contacts:  r.so_lien_he,
      saved:     r.luot_luu,
      image:     r.anh_bia || r.anh_dau_tien || null,
      postedAt:  timeAgo(r.ngay_tao),
    }));
    return res.json({ rooms });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/employer/rooms/:id — sửa tin đăng
router.put('/rooms/:id', auth(['employer', 'admin']), async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  const ma_nd = req.user.id;
  const {
    title, type, city, district, address,
    price, deposit, area, description,
    contactName, contactPhone, contactEmail, showPhone,
    amenities = [],
    images    = [],   // base64 mới (nếu có), URL cũ giữ nguyên
    keepImages = [],  // URL ảnh cũ muốn giữ lại
  } = req.body;

  if (!title || !type || !city || !address || !price || !area || !contactName || !contactPhone)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

  try {
    await poolConnect;

    // 1. Cập nhật thông tin phòng (trạng thái về pending để admin duyệt lại)
    const upd = await pool.request()
      .input('ma_phong',      sql.Int,          ma_phong)
      .input('ma_chu_tro',    sql.Int,          ma_nd)
      .input('tieu_de',       sql.NVarChar(200), title)
      .input('loai_phong',    sql.NVarChar(50),  type)
      .input('tinh_thanh',    sql.NVarChar(100), city)
      .input('quan_huyen',    sql.NVarChar(100), district || null)
      .input('dia_chi',       sql.NVarChar(300), address)
      .input('gia_thue',      sql.Decimal(12,0), parseFloat(price))
      .input('tien_coc',      sql.Decimal(12,0), deposit ? parseFloat(deposit) : null)
      .input('dien_tich',     sql.Decimal(6,1),  parseFloat(area))
      .input('mo_ta',         sql.NVarChar(sql.MAX), description || null)
      .input('ten_lien_he',   sql.NVarChar(100), contactName)
      .input('sdt_lien_he',   sql.NVarChar(20),  contactPhone)
      .input('email_lien_he', sql.NVarChar(150), contactEmail || null)
      .input('hien_sdt',      sql.Bit,           showPhone ? 1 : 0)
      .execute('sp_SuaPhong');

    if (!upd.recordset[0]?.affected)
      return res.status(403).json({ message: 'Không tìm thấy hoặc không có quyền sửa' });

    // 2. Xóa ảnh cũ không còn trong keepImages, giữ lại ảnh trong keepImages
    await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .query(`DELETE FROM anh_phong WHERE ma_phong=@ma_phong`);

    // 3. Insert lại ảnh giữ + ảnh mới
    const allImages = [...keepImages, ...images];
    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i];
      if (!img) continue;
      try {
        await pool.request()
          .input('ma_phong',   sql.Int,               ma_phong)
          .input('duong_dan',  sql.NVarChar(sql.MAX),  img)
          .input('la_anh_bia', sql.Bit,                i === 0 ? 1 : 0)
          .input('thu_tu',     sql.Int,                i)
          .execute('sp_ThemAnhPhong');
      } catch (imgErr) {
        console.error('Lỗi insert ảnh:', imgErr.message);
      }
    }

    // 4. Cập nhật tiện ích: xóa cũ, insert mới
    await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .query(`DELETE FROM tien_ich_phong WHERE ma_phong=@ma_phong`);

    for (const key of amenities) {
      await pool.request()
        .input('ma_phong', sql.Int,          ma_phong)
        .input('ma_khoa',  sql.NVarChar(50), key)
        .execute('sp_ThemTienIchPhong');
    }

    return res.json({ message: 'Cập nhật tin đăng thành công, đang chờ duyệt lại' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// PATCH /api/employer/rooms/:id/status — đổi trạng thái (pause/activate)
router.patch('/rooms/:id/status', auth(['employer', 'admin']), async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  const { status } = req.body;
  const allowed = ['approved', 'paused'];
  if (!allowed.includes(status))
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    await poolConnect;
    await pool.request()
      .input('ma_phong',   sql.Int,          ma_phong)
      .input('ma_chu_tro', sql.Int,          req.user.id)
      .input('trang_thai', sql.NVarChar(20), status)
      .execute('sp_CapNhatTrangThaiPhong');
    return res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/employer/rooms/:id — xóa tin
router.delete('/rooms/:id', auth(['employer', 'admin']), async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  try {
    await poolConnect;
    await pool.request()
      .input('ma_phong',   sql.Int, ma_phong)
      .input('ma_chu_tro', sql.Int, req.user.id)
      .execute('sp_XoaPhong');
    return res.json({ message: 'Đã xóa tin đăng' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/employer/rooms/:id/detail
router.get('/rooms/:id/detail', auth(['employer', 'admin']), async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  const ma_nd = req.user.id;
  try {
    await poolConnect;

    const roomRes = await pool.request()
      .input('ma_phong',   sql.Int, ma_phong)
      .input('ma_chu_tro', sql.Int, ma_nd)
      .query(`
        SELECT p.*, n.ho_ten AS ten_chu_tro, n.anh_dai_dien,
          (SELECT COUNT(*) FROM yeu_thich yt WHERE yt.ma_phong = p.ma_phong) AS luot_luu
        FROM phong_tro p
        JOIN nguoi_dung n ON n.ma_nd = p.ma_chu_tro
        WHERE p.ma_phong = @ma_phong AND p.ma_chu_tro = @ma_chu_tro
      `);

    if (!roomRes.recordset.length)
      return res.status(404).json({ message: 'Không tìm thấy phòng' });

    const r = roomRes.recordset[0];

    const imgRes = await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .query(`SELECT duong_dan, la_anh_bia FROM anh_phong WHERE ma_phong=@ma_phong ORDER BY la_anh_bia DESC, thu_tu ASC`);

    const amenRes = await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .query(`
        SELECT ti.ma_khoa, ti.ten_hien_thi, ti.bieu_tuong
        FROM tien_ich_phong tip
        JOIN tien_ich ti ON ti.ma_tien_ich = tip.ma_tien_ich
        WHERE tip.ma_phong = @ma_phong
      `);

    return res.json({
      room: {
        id:           r.ma_phong,
        title:        r.tieu_de,
        type:         r.loai_phong,
        city:         r.tinh_thanh,
        district:     r.quan_huyen,
        address:      r.dia_chi,
        price:        r.gia_thue,
        deposit:      r.tien_coc,
        area:         r.dien_tich,
        description:  r.mo_ta,
        available:    r.con_phong,
        isFeatured:   r.noi_bat,
        status:       r.trang_thai,
        views:        r.luot_xem,
        contacts:     r.so_lien_he,
        saved:        r.luot_luu,
        contactName:  r.ten_lien_he,
        contactPhone: r.sdt_lien_he,
        contactEmail: r.email_lien_he,
        showPhone:    r.hien_sdt,
        postedAt:     timeAgo(r.ngay_tao),
        updatedAt:    timeAgo(r.ngay_cap_nhat),
        images:       imgRes.recordset.map(i => i.duong_dan),
        amenities:    amenRes.recordset.map(a => ({ key: a.ma_khoa, label: a.ten_hien_thi, icon: a.bieu_tuong })),
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/employer/notifications
router.get('/notifications', auth(['employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd',    sql.Int, req.user.id)
      .input('gioi_han', sql.Int, 20)
      .execute('sp_LayThongBao');
    const notifications = result.recordset.map(n => ({
      id:     n.ma_tb,
      icon:   n.bieu_tuong || '🔔',
      text:   n.noi_dung,
      unread: !n.da_doc,
      time:   timeAgo(n.ngay_tao),
    }));
    return res.json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/employer/notifications/read-all
router.post('/notifications/read-all', auth(['employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    await pool.request().input('ma_nd', sql.Int, req.user.id).execute('sp_DocTatCaThongBao');
    return res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
