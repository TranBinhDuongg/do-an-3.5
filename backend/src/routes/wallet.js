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

// GET /api/wallet/transactions/summary — thống kê tổng hợp (phải đặt TRƯỚC /transactions)
router.get('/transactions/summary', auth(['employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN loai='topup'   AND trang_thai='success' THEN so_tien ELSE 0 END),0) AS tong_nap,
          ISNULL(SUM(CASE WHEN loai='payment' AND trang_thai='success' THEN so_tien ELSE 0 END),0) AS tong_chi,
          ISNULL(SUM(CASE WHEN loai='refund'  AND trang_thai='success' THEN so_tien ELSE 0 END),0) AS tong_hoan,
          COUNT(*) AS tong_gd,
          COUNT(CASE WHEN trang_thai='pending' THEN 1 END) AS cho_xu_ly
        FROM giao_dich WHERE ma_nd = @ma_nd
      `);
    return res.json(result.recordset[0] || { tong_nap: 0, tong_chi: 0, tong_hoan: 0, tong_gd: 0, cho_xu_ly: 0 });
  } catch (err) {
    console.error('summary error:', err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/wallet/transactions — lịch sử giao dịch (có phân trang, lọc ngày)
router.get('/transactions', auth(['employer', 'admin']), async (req, res) => {
  const { loai, tu_ngay, den_ngay, trang = 1, gioi_han = 10 } = req.query;
  const page  = Math.max(1, parseInt(trang)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(gioi_han) || 10));
  const skip  = (page - 1) * limit;
  try {
    await poolConnect;
    const req2 = pool.request().input('ma_nd', sql.Int, req.user.id);

    let where = 'WHERE ma_nd = @ma_nd';
    if (loai)     { req2.input('loai',     sql.NVarChar(20), loai);     where += ' AND loai = @loai'; }
    if (tu_ngay)  { req2.input('tu_ngay',  sql.Date, tu_ngay);          where += ' AND CAST(ngay_tao AS DATE) >= @tu_ngay'; }
    if (den_ngay) { req2.input('den_ngay', sql.Date, den_ngay);         where += ' AND CAST(ngay_tao AS DATE) <= @den_ngay'; }

    req2.input('skip',  sql.Int, skip);
    req2.input('limit', sql.Int, limit);

    const result = await req2.query(`
      SELECT
        ma_gd, loai, so_tien, mo_ta, trang_thai,
        phuong_thuc, ma_tham_chieu, ma_goi, ngay_tao,
        COUNT(*) OVER() AS tong_so
      FROM giao_dich
      ${where}
      ORDER BY ngay_tao DESC
      OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const tong_so = result.recordset[0]?.tong_so ?? 0;
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
    return res.json({ transactions, tong_so, trang: page, gioi_han: limit });
  } catch (err) {
    console.error('transactions error:', err);
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

// GET /api/wallet/my-package — lấy thông tin gói hiện tại
router.get('/my-package', auth(['employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .execute('sp_LayGoiHienTai');
    
    if (result.recordset.length === 0) {
      return res.json({ package: null });
    }
    
    const p = result.recordset[0];
    return res.json({
      package: {
        id: p.ma,
        name: p.ten_goi,
        limit: p.gioi_han_tin,
        used: p.tin_da_dang || 0,
        pushLimit: p.luot_day_tin || 0,
        pushUsed: p.day_tin_da_dung || 0,
        maxImages: p.so_anh_toi_da || 5,
        autoApprove: p.duyet_tu_dong || false,
        badge: p.huy_hieu,
        hasVideo: p.ho_tro_video || false,
        start: p.bat_dau,
        end: p.het_han,
        daysLeft: p.ngay_con_lai
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/wallet/packages — danh sách gói đăng tin
router.get('/packages', auth(['employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(
      `SELECT ma_goi, ten_goi, gia, so_ngay, gioi_han_tin, noi_bat, mo_ta, duyet_tu_dong, so_anh_toi_da, luot_day_tin, huy_hieu, muc_do_uu_tien, ho_tro_video FROM goi_dang_tin ORDER BY gia ASC`
    );
    return res.json({ packages: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
