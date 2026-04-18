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
