const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

// GET /api/notifications
router.get('/', auth(['user', 'employer', 'admin']), async (req, res) => {
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

// POST /api/notifications/read-all
router.post('/read-all', auth(['user', 'employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .execute('sp_DocTatCaThongBao');
    return res.json({ message: 'Đã đọc tất cả' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/notifications/read/:id
router.post('/read/:id', auth(['user', 'employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    await pool.request()
      .input('ma_tb', sql.Int, parseInt(req.params.id))
      .input('ma_nd', sql.Int, req.user.id)
      .query(`UPDATE thong_bao SET da_doc=1 WHERE ma_tb=@ma_tb AND ma_nd=@ma_nd`);
    return res.json({ message: 'Đã đọc' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
