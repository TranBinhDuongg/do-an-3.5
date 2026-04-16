const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

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

// GET /api/favorites — lấy danh sách yêu thích của user
router.get('/', auth(['user']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .query(`
        SELECT p.ma_phong, p.tieu_de, p.loai_phong, p.tinh_thanh, p.dia_chi,
               p.gia_thue, p.dien_tich, p.con_phong, p.noi_bat, p.ngay_tao,
               (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong AND la_anh_bia = 1) AS anh_bia,
               (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong ORDER BY thu_tu) AS anh_dau_tien,
               y.ngay_tao AS ngay_luu
        FROM yeu_thich y
        JOIN phong_tro p ON p.ma_phong = y.ma_phong
        WHERE y.ma_nd = @ma_nd AND p.trang_thai = 'approved'
        ORDER BY y.ngay_tao DESC
      `);

    const rooms = result.recordset.map(r => ({
      id:        r.ma_phong,
      title:     r.tieu_de,
      type:      r.loai_phong,
      city:      r.tinh_thanh,
      address:   r.dia_chi,
      price:     r.gia_thue,
      area:      r.dien_tich,
      available: r.con_phong,
      isFeatured: r.noi_bat,
      image:     r.anh_bia || r.anh_dau_tien || null,
      postedAt:  timeAgo(r.ngay_tao),
      savedAt:   timeAgo(r.ngay_luu),
    }));

    return res.json({ rooms });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/favorites/:id — thêm yêu thích
router.post('/:id', auth(['user']), async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  try {
    await poolConnect;
    await pool.request()
      .input('ma_nd',    sql.Int, req.user.id)
      .input('ma_phong', sql.Int, ma_phong)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM yeu_thich WHERE ma_nd = @ma_nd AND ma_phong = @ma_phong)
          INSERT INTO yeu_thich (ma_nd, ma_phong) VALUES (@ma_nd, @ma_phong)
      `);
    return res.json({ message: 'Đã thêm vào yêu thích' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/favorites/:id — xóa yêu thích
router.delete('/:id', auth(['user']), async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  try {
    await poolConnect;
    await pool.request()
      .input('ma_nd',    sql.Int, req.user.id)
      .input('ma_phong', sql.Int, ma_phong)
      .query(`DELETE FROM yeu_thich WHERE ma_nd = @ma_nd AND ma_phong = @ma_phong`);
    return res.json({ message: 'Đã xóa khỏi yêu thích' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/favorites/check/:id — kiểm tra đã yêu thích chưa
router.get('/check/:id', auth(['user']), async (req, res) => {
  const ma_phong = parseInt(req.params.id);
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd',    sql.Int, req.user.id)
      .input('ma_phong', sql.Int, ma_phong)
      .query(`SELECT 1 AS da_luu FROM yeu_thich WHERE ma_nd = @ma_nd AND ma_phong = @ma_phong`);
    return res.json({ saved: result.recordset.length > 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
