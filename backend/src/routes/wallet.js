const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/wallet/balance — lấy số dư ví
router.get('/balance', auth(['employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .execute('sp_LayViTien');
    const so_du = result.recordset[0]?.so_du ?? 0;
    return res.json({ so_du });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/wallet/transactions — lịch sử giao dịch
router.get('/transactions', auth(['employer', 'admin']), async (req, res) => {
  const { loai } = req.query;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd',    sql.Int,          req.user.id)
      .input('loai',     sql.NVarChar(20), loai || null)
      .input('gioi_han', sql.Int,          50)
      .input('bo_qua',   sql.Int,          0)
      .execute('sp_LayLichSuGiaoDich');

    const transactions = result.recordset.map(t => ({
      id:        t.ma_gd,
      type:      t.loai,
      amount:    t.loai === 'payment' ? -t.so_tien : t.so_tien,
      desc:      t.mo_ta,
      status:    t.trang_thai,
      method:    t.phuong_thuc,
      ref:       t.ma_tham_chieu,
      packageId: t.ma_goi,
      date:      new Date(t.ngay_tao).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    }));
    return res.json({ transactions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/wallet/topup — tạo yêu cầu nạp tiền
router.post('/topup', auth(['employer', 'admin']), async (req, res) => {
  const { so_tien, phuong_thuc } = req.body;
  const validMethods = ['bank', 'momo', 'zalo', 'card'];

  if (!so_tien || so_tien < 10000)
    return res.status(400).json({ message: 'Số tiền tối thiểu là 10.000đ' });
  if (!phuong_thuc || !validMethods.includes(phuong_thuc))
    return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd',       sql.Int,          req.user.id)
      .input('so_tien',     sql.Decimal(15,0), so_tien)
      .input('phuong_thuc', sql.NVarChar(50),  phuong_thuc)
      .execute('sp_TaoYeuCauNapTien');

    const ma_gd = result.recordset[0]?.ma_gd;
    return res.status(201).json({
      message: 'Yêu cầu nạp tiền đã được ghi nhận. Vui lòng chuyển khoản và chờ admin xác nhận.',
      ma_gd,
      // Thông tin chuyển khoản mẫu
      bank_info: {
        bank:    'Vietcombank',
        account: '1234567890',
        name:    'PHONG TRO VN',
        content: `NAP ${req.user.id} ${ma_gd}`,
        amount:  so_tien,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('MIN_AMOUNT'))
      return res.status(400).json({ message: 'Số tiền tối thiểu là 10.000đ' });
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/wallet/purchase — mua gói bằng ví
router.post('/purchase', auth(['employer', 'admin']), async (req, res) => {
  const { ma_goi } = req.body;
  if (!ma_goi) return res.status(400).json({ message: 'Thiếu mã gói' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd',  sql.Int, req.user.id)
      .input('ma_goi', sql.Int, ma_goi)
      .execute('sp_MuaGoi');

    const so_du_moi = result.recordset[0]?.so_du_moi ?? 0;
    return res.json({ message: 'Mua gói thành công!', so_du_moi });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('INSUFFICIENT_BALANCE'))
      return res.status(400).json({ message: 'Số dư không đủ. Vui lòng nạp thêm tiền.' });
    if (err.message?.includes('GOI_NOT_FOUND'))
      return res.status(404).json({ message: 'Không tìm thấy gói' });
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;

// GET /api/wallet/packages — danh sách gói đăng tin
router.get('/packages', auth(['employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(
      `SELECT ma_goi, ten_goi, gia, so_ngay, gioi_han_tin, noi_bat, mo_ta FROM goi_dang_tin ORDER BY gia ASC`
    );
    return res.json({ packages: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});
