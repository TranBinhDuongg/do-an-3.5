const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');

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

function formatRoom(r) {
  return {
    id:         r.ma_phong,
    title:      r.tieu_de,
    type:       r.loai_phong,
    city:       r.tinh_thanh,
    address:    r.dia_chi,
    price:      r.gia_thue,
    area:       r.dien_tich,
    available:  r.con_phong,
    isFeatured: r.noi_bat,
    image:      r.anh_bia || r.anh_dau_tien || null,
    postedAt:   timeAgo(r.ngay_tao),
  };
}

// GET /api/rooms?keyword=&city=&type=&minPrice=&maxPrice=&minArea=&sort=&page=
router.get('/', async (req, res) => {
  const { keyword, city, type, minPrice, maxPrice, minArea, sort = 'newest', page = 1 } = req.query;
  const gioi_han = 12;
  const bo_qua   = (parseInt(page) - 1) * gioi_han;

  try {
    await poolConnect;
    const req1 = pool.request()
      .input('tu_khoa',    sql.NVarChar, keyword  || null)
      .input('tinh_thanh', sql.NVarChar, city     || null)
      .input('loai_phong', sql.NVarChar, type     || null)
      .input('gia_min',    sql.Decimal,  minPrice ? parseFloat(minPrice) : null)
      .input('gia_max',    sql.Decimal,  maxPrice ? parseFloat(maxPrice) : null)
      .input('dt_min',     sql.Decimal,  minArea  ? parseFloat(minArea)  : null)
      .input('sap_xep',    sql.NVarChar, sort)
      .input('gioi_han',   sql.Int,      gioi_han)
      .input('bo_qua',     sql.Int,      bo_qua);

    const req2 = pool.request()
      .input('tu_khoa',    sql.NVarChar, keyword  || null)
      .input('tinh_thanh', sql.NVarChar, city     || null)
      .input('loai_phong', sql.NVarChar, type     || null)
      .input('gia_min',    sql.Decimal,  minPrice ? parseFloat(minPrice) : null)
      .input('gia_max',    sql.Decimal,  maxPrice ? parseFloat(maxPrice) : null)
      .input('dt_min',     sql.Decimal,  minArea  ? parseFloat(minArea)  : null);

    const [roomsResult, countResult] = await Promise.all([
      req1.execute('sp_LayDanhSachPhong'),
      req2.execute('sp_DemPhong'),
    ]);

    const rooms = roomsResult.recordset.map(formatRoom);
    const total = countResult.recordset[0].tong_so;

    return res.json({ rooms, total, page: parseInt(page), totalPages: Math.ceil(total / gioi_han) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/rooms/home
router.get('/home', async (req, res) => {  try {
    await poolConnect;
    const [newRes, featRes, statsRes] = await Promise.all([
      pool.request().input('gioi_han', sql.Int, 6).execute('sp_LayPhongMoi'),
      pool.request().input('gioi_han', sql.Int, 6).execute('sp_LayPhongNoiBat'),
      pool.request().execute('sp_LayThongKe'),
    ]);

    const thongKe = statsRes.recordset[0];
    return res.json({
      newRooms:      newRes.recordset.map(formatRoom),
      featuredRooms: featRes.recordset.map(formatRoom),
      stats: {
        total_rooms:     thongKe.tong_phong,
        total_employers: thongKe.tong_chu_tro,
        total_users:     thongKe.tong_nguoi_thue,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/rooms/:id - Chi tiết phòng
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return res.status(400).json({ message: 'ID không hợp lệ' });

  try {
    await poolConnect;

    // Tăng lượt xem
    await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .query(`UPDATE phong_tro SET luot_xem = luot_xem + 1 WHERE ma_phong = @ma_phong`);

    // Thông tin phòng + chủ trọ
    const roomRes = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .query(`
        SELECT p.*, n.ho_ten, n.anh_dai_dien
        FROM phong_tro p
        JOIN nguoi_dung n ON n.ma_nd = p.ma_chu_tro
        WHERE p.ma_phong = @ma_phong AND p.trang_thai = 'approved'
      `);

    if (!roomRes.recordset.length) return res.status(404).json({ message: 'Không tìm thấy phòng' });
    const r = roomRes.recordset[0];

    // Ảnh
    const imgRes = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .query(`SELECT duong_dan FROM anh_phong WHERE ma_phong = @ma_phong ORDER BY la_anh_bia DESC, thu_tu ASC`);

    // Tiện ích
    const amenRes = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .query(`
        SELECT ti.ma_khoa, ti.ten_hien_thi, ti.bieu_tuong
        FROM tien_ich_phong tip
        JOIN tien_ich ti ON ti.ma_tien_ich = tip.ma_tien_ich
        WHERE tip.ma_phong = @ma_phong
      `);

    // Phòng liên quan
    const relRes = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .input('loai_phong', sql.NVarChar, r.loai_phong)
      .input('tinh_thanh', sql.NVarChar, r.tinh_thanh)
      .query(`
        SELECT TOP 4
          p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
          p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.ngay_tao,
          (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong AND ap.la_anh_bia=1) AS anh_bia,
          (SELECT TOP 1 duong_dan FROM anh_phong ap WHERE ap.ma_phong=p.ma_phong ORDER BY ap.thu_tu) AS anh_dau_tien
        FROM phong_tro p
        WHERE p.trang_thai = 'approved'
          AND p.ma_phong != @ma_phong
          AND (p.loai_phong = @loai_phong OR p.tinh_thanh = @tinh_thanh)
        ORDER BY p.noi_bat DESC, p.ngay_tao DESC
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
        views:        r.luot_xem,
        lat:          r.latitude  ? parseFloat(r.latitude)  : null,
        lon:          r.longitude ? parseFloat(r.longitude) : null,
        contactName:  r.ten_lien_he,
        contactPhone: r.hien_sdt ? r.sdt_lien_he : null,
        contactEmail: r.email_lien_he,
        ownerName:    r.ho_ten,
        ownerAvatar:  r.anh_dai_dien,
        postedAt:     timeAgo(r.ngay_tao),
        images:       imgRes.recordset.map(i => i.duong_dan),
        amenities:    amenRes.recordset.map(a => ({ key: a.ma_khoa, label: a.ten_hien_thi, icon: a.bieu_tuong })),
      },
      related: relRes.recordset.map(formatRoom),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
