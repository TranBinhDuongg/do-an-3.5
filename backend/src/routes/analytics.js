const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/employer
// Trả về: stats tổng, danh sách phòng với metrics, view theo ngày 30 ngày gần nhất (mock từ luot_xem)
router.get('/employer', auth(['employer', 'admin']), async (req, res) => {
  const ma_nd = req.user.id;
  try {
    await poolConnect;

    // 1. Lấy tất cả phòng của chủ trọ kèm metrics
    const roomsRes = await pool.request()
      .input('ma_nd', sql.Int, ma_nd)
      .input('trang_thai', sql.NVarChar(20), null)
      .execute('sp_LayPhongChuTroFilter');

    const rooms = roomsRes.recordset.map(r => ({
      id:       r.ma_phong,
      title:    r.tieu_de,
      status:   r.trang_thai,
      views:    r.luot_xem    || 0,
      contacts: r.so_lien_he  || 0,
      saved:    r.luot_luu    || 0,
      price:    r.gia_thue    || 0,
      area:     r.dien_tich   || 0,
      type:     r.loai_phong,
      available: r.con_phong,
      image:    r.anh_bia || r.anh_dau_tien || null,
      createdAt: r.ngay_tao,
    }));

    // 2. Tổng stats
    const totalViews    = rooms.reduce((s, r) => s + r.views,    0);
    const totalContacts = rooms.reduce((s, r) => s + r.contacts, 0);
    const totalSaved    = rooms.reduce((s, r) => s + r.saved,    0);
    const activeRooms   = rooms.filter(r => r.status === 'approved').length;

    // 3. Tạo dữ liệu biểu đồ 30 ngày (phân phối lượt xem theo ngày dựa trên tổng)
    // Vì DB không lưu view log theo ngày, ta simulate dựa trên tổng views với trend tăng dần
    const today = new Date();
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      // Phân phối ngẫu nhiên nhưng seed theo ngày để ổn định
      const seed = d.getDate() + d.getMonth() * 31;
      const weight = 0.5 + (seed % 7) / 10;
      const dayViews = Math.round((totalViews / 30) * weight);
      chartData.push({ date: label, views: dayViews, contacts: Math.round((totalContacts / 30) * weight) });
    }

    // 4. Gợi ý cải thiện
    const suggestions = [];
    const noImageRooms = rooms.filter(r => !r.image);
    if (noImageRooms.length > 0)
      suggestions.push({ type: 'warning', text: `${noImageRooms.length} tin đăng chưa có ảnh — thêm ảnh để tăng lượt xem lên ~3x` });

    const lowViewRooms = rooms.filter(r => r.status === 'approved' && r.views < 10);
    if (lowViewRooms.length > 0)
      suggestions.push({ type: 'info', text: `${lowViewRooms.length} tin đăng có ít hơn 10 lượt xem — thử đẩy tin lên top` });

    const highViewLowContact = rooms.filter(r => r.views > 50 && r.contacts === 0);
    if (highViewLowContact.length > 0)
      suggestions.push({ type: 'warning', text: `${highViewLowContact.length} tin có nhiều lượt xem nhưng 0 liên hệ — kiểm tra lại giá hoặc mô tả` });

    if (totalContacts > 0 && activeRooms > 0)
      suggestions.push({ type: 'success', text: `Tỷ lệ chuyển đổi: ${((totalContacts / totalViews) * 100).toFixed(1)}% — ${totalContacts > totalViews * 0.05 ? 'Tốt!' : 'Cần cải thiện mô tả'}` });

    if (suggestions.length === 0)
      suggestions.push({ type: 'success', text: 'Tất cả tin đăng đang hoạt động tốt!' });

    return res.json({
      stats: { totalViews, totalContacts, totalSaved, activeRooms, totalRooms: rooms.length },
      rooms,
      chartData,
      suggestions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
