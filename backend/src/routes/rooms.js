const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');

const router = express.Router();

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
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
router.get('/home', async (req, res) => {
  try {
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

module.exports = router;
