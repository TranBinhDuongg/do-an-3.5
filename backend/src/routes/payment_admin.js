const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/topups — danh sách yêu cầu nạp tiền
router.get('/topups', auth(['admin']), async (req, res) => {
  const { trang_thai } = req.query;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('trang_thai', sql.NVarChar(20), trang_thai || null)
      .input('gioi_han',   sql.Int,          20)
      .input('bo_qua',     sql.Int,          0)
      .execute('sp_AdminLayYeuCauNapTien');

    const items = result.recordset.map(r => ({
      id:        r.ma_gd,
      userId:    r.ma_nd,
      userName:  r.ho_ten,
      account:   r.tai_khoan,
      amount:    r.so_tien,
      method:    r.phuong_thuc,
      status:    r.trang_thai,
      ref:       r.ma_tham_chieu,
      createdAt: new Date(r.ngay_tao).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      total:     r.tong_so,
    }));
    return res.json({ items, total: result.recordset[0]?.tong_so ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/admin/topups/:id/approve — duyệt nạp tiền
router.post('/topups/:id/approve', auth(['admin']), async (req, res) => {
  const ma_gd = parseInt(req.params.id);
  const { ma_tham_chieu } = req.body;
  try {
    await poolConnect;
    await pool.request()
      .input('ma_gd',         sql.Int,           ma_gd)
      .input('ma_tham_chieu', sql.NVarChar(100),  ma_tham_chieu || null)
      .execute('sp_DuyetNapTien');
    return res.json({ message: 'Đã duyệt nạp tiền thành công' });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('NOT_FOUND'))
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    if (err.message?.includes('ALREADY_PROCESSED'))
      return res.status(400).json({ message: 'Giao dịch đã được xử lý' });
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/admin/topups/:id/reject — từ chối nạp tiền
router.post('/topups/:id/reject', auth(['admin']), async (req, res) => {
  const ma_gd = parseInt(req.params.id);
  try {
    await poolConnect;
    await pool.request()
      .input('ma_gd', sql.Int, ma_gd)
      .execute('sp_TuChoiNapTien');
    return res.json({ message: 'Đã từ chối yêu cầu nạp tiền' });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('NOT_FOUND'))
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    if (err.message?.includes('ALREADY_PROCESSED'))
      return res.status(400).json({ message: 'Giao dịch đã được xử lý' });
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/admin/revenue — thống kê doanh thu
router.get('/revenue', auth(['admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().execute('sp_AdminThongKeDoanhThu');
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
