const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── USER: Gửi yêu cầu đặt phòng ───────────────────────────────────────────
// POST /api/bookings
router.post('/', auth(['user']), async (req, res) => {
  const { ma_phong, ngay_bat_dau, ngay_ket_thuc, ghi_chu } = req.body;
  if (!ma_phong || !ngay_bat_dau || !ngay_ket_thuc)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

  const start = new Date(ngay_bat_dau);
  const end   = new Date(ngay_ket_thuc);
  if (end <= start)
    return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });

  try {
    await poolConnect;
    // Lấy thông tin phòng
    const roomRes = await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .query(`SELECT ma_phong, ma_chu_tro, gia_thue, tien_coc, trang_thai, con_phong
              FROM phong_tro WHERE ma_phong = @ma_phong`);

    const room = roomRes.recordset[0];
    if (!room) return res.status(404).json({ message: 'Phòng không tồn tại' });
    if (room.trang_thai !== 'approved') return res.status(400).json({ message: 'Phòng chưa được duyệt' });
    if (!room.con_phong) return res.status(400).json({ message: 'Phòng đã hết chỗ' });
    if (room.ma_chu_tro === req.user.id) return res.status(400).json({ message: 'Không thể đặt phòng của chính mình' });

    // Kiểm tra đã có booking pending/confirmed chưa
    const existRes = await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .input('ma_nd',    sql.Int, req.user.id)
      .query(`SELECT 1 FROM dat_phong
              WHERE ma_phong = @ma_phong AND ma_nguoi_thue = @ma_nd
                AND trang_thai IN ('pending','confirmed','active')`);
    if (existRes.recordset.length > 0)
      return res.status(400).json({ message: 'Bạn đã có yêu cầu đặt phòng này đang xử lý' });

    const result = await pool.request()
      .input('ma_phong',      sql.Int,          ma_phong)
      .input('ma_nguoi_thue', sql.Int,          req.user.id)
      .input('ma_chu_tro',    sql.Int,          room.ma_chu_tro)
      .input('ngay_bat_dau',  sql.Date,         start)
      .input('ngay_ket_thuc', sql.Date,         end)
      .input('tien_thue',     sql.Decimal(12,0), room.gia_thue)
      .input('tien_coc',      sql.Decimal(12,0), room.tien_coc || 0)
      .input('ghi_chu',       sql.NVarChar(500), ghi_chu || null)
      .query(`INSERT INTO dat_phong (ma_phong, ma_nguoi_thue, ma_chu_tro, ngay_bat_dau, ngay_ket_thuc, tien_thue, tien_coc, ghi_chu)
              OUTPUT INSERTED.ma_dp
              VALUES (@ma_phong, @ma_nguoi_thue, @ma_chu_tro, @ngay_bat_dau, @ngay_ket_thuc, @tien_thue, @tien_coc, @ghi_chu)`);

    const ma_dp = result.recordset[0].ma_dp;

    // Thông báo cho chủ trọ
    await pool.request()
      .input('ma_nd',    sql.Int,          room.ma_chu_tro)
      .input('noi_dung', sql.NVarChar(500), `📋 Bạn có yêu cầu đặt phòng mới (mã #${ma_dp})`)
      .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'📋', @noi_dung)`);

    return res.status(201).json({ message: 'Gửi yêu cầu đặt phòng thành công', ma_dp });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── USER: Lấy danh sách booking của mình ───────────────────────────────────
// GET /api/bookings/my
router.get('/my', auth(['user']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .query(`SELECT dp.ma_dp, dp.trang_thai, dp.ngay_bat_dau, dp.ngay_ket_thuc,
                     dp.tien_thue, dp.tien_coc, dp.ghi_chu, dp.ngay_tao,
                     dp.ma_chu_tro, dp.ma_phong,
                     p.tieu_de, p.dia_chi, p.tinh_thanh,
                     (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong AND la_anh_bia = 1) AS anh_bia,
                     nd.ho_ten AS ten_chu_tro, nd.dien_thoai AS sdt_chu_tro,
                     hd.ma_hd
              FROM dat_phong dp
              JOIN phong_tro p  ON p.ma_phong = dp.ma_phong
              JOIN nguoi_dung nd ON nd.ma_nd = dp.ma_chu_tro
              LEFT JOIN hop_dong hd ON hd.ma_dp = dp.ma_dp
              WHERE dp.ma_nguoi_thue = @ma_nd
              ORDER BY dp.ngay_tao DESC`);

    return res.json({ bookings: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── USER: Hủy booking ──────────────────────────────────────────────────────
// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', auth(['user']), async (req, res) => {
  try {
    await poolConnect;
    // Lấy thông tin trước
    const check = await pool.request()
      .input('ma_dp', sql.Int, req.params.id)
      .input('ma_nd', sql.Int, req.user.id)
      .query(`SELECT ma_chu_tro FROM dat_phong
              WHERE ma_dp = @ma_dp AND ma_nguoi_thue = @ma_nd AND trang_thai IN ('pending','confirmed')`);

    if (check.recordset.length === 0)
      return res.status(400).json({ message: 'Không thể hủy booking này' });

    const ma_chu_tro = check.recordset[0].ma_chu_tro;

    await pool.request()
      .input('ma_dp', sql.Int, req.params.id)
      .query(`UPDATE dat_phong SET trang_thai = 'cancelled' WHERE ma_dp = @ma_dp`);

    await pool.request()
      .input('ma_nd',    sql.Int,           ma_chu_tro)
      .input('noi_dung', sql.NVarChar(500), `❌ Người thuê đã hủy yêu cầu đặt phòng #${req.params.id}`)
      .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'❌', @noi_dung)`);

    return res.json({ message: 'Đã hủy yêu cầu đặt phòng' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── EMPLOYER: Lấy danh sách booking cho phòng của mình ─────────────────────
// GET /api/bookings/employer
router.get('/employer', auth(['employer']), async (req, res) => {
  const { trang_thai } = req.query;
  try {
    await poolConnect;
    const req1 = pool.request().input('ma_chu_tro', sql.Int, req.user.id);
    let whereStatus = '';
    if (trang_thai) {
      req1.input('trang_thai', sql.NVarChar(20), trang_thai);
      whereStatus = 'AND dp.trang_thai = @trang_thai';
    }
    const result = await req1.query(`
      SELECT dp.ma_dp, dp.trang_thai, dp.ngay_bat_dau, dp.ngay_ket_thuc,
             dp.tien_thue, dp.tien_coc, dp.ghi_chu, dp.ngay_tao,
             dp.ma_nguoi_thue,
             p.ma_phong, p.tieu_de, p.dia_chi, p.tinh_thanh,
             nd.ho_ten AS ten_nguoi_thue, nd.dien_thoai AS sdt_nguoi_thue,
             nd.tai_khoan AS email_nguoi_thue,
             hd.ma_hd
      FROM dat_phong dp
      JOIN phong_tro p   ON p.ma_phong = dp.ma_phong
      JOIN nguoi_dung nd  ON nd.ma_nd = dp.ma_nguoi_thue
      LEFT JOIN hop_dong hd ON hd.ma_dp = dp.ma_dp
      WHERE dp.ma_chu_tro = @ma_chu_tro ${whereStatus}
      ORDER BY dp.ngay_tao DESC`);

    return res.json({ bookings: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── EMPLOYER: Xác nhận / từ chối booking ───────────────────────────────────
// PUT /api/bookings/:id/respond
router.put('/:id/respond', auth(['employer']), async (req, res) => {
  const { action } = req.body; // 'confirmed' | 'rejected'
  if (!['confirmed', 'rejected'].includes(action))
    return res.status(400).json({ message: 'Action không hợp lệ' });

  try {
    await poolConnect;

    // Lấy thông tin booking trước
    const bookingRes = await pool.request()
      .input('ma_dp',      sql.Int, req.params.id)
      .input('ma_chu_tro', sql.Int, req.user.id)
      .query(`SELECT ma_dp, ma_nguoi_thue, ma_phong, ngay_bat_dau, ngay_ket_thuc, tien_thue, tien_coc
              FROM dat_phong
              WHERE ma_dp = @ma_dp AND ma_chu_tro = @ma_chu_tro AND trang_thai = 'pending'`);

    if (bookingRes.recordset.length === 0)
      return res.status(400).json({ message: 'Không tìm thấy booking hoặc đã xử lý' });

    const booking = bookingRes.recordset[0];

    // Cập nhật trạng thái
    await pool.request()
      .input('ma_dp',      sql.Int,          req.params.id)
      .input('trang_thai', sql.NVarChar(20), action)
      .query(`UPDATE dat_phong SET trang_thai = @trang_thai WHERE ma_dp = @ma_dp`);

    // Nếu xác nhận → tạo hợp đồng nháp
    if (action === 'confirmed') {
      const defaultTerms = `ĐIỀU KHOẢN HỢP ĐỒNG THUÊ NHÀ\n\n` +
        `1. Bên thuê có trách nhiệm giữ gìn tài sản, không gây ồn ào sau 22h.\n` +
        `2. Thanh toán tiền thuê đúng hạn vào ngày 5 hàng tháng.\n` +
        `3. Tiền cọc sẽ được hoàn trả sau khi kết thúc hợp đồng, trừ các khoản hư hỏng (nếu có).\n` +
        `4. Thông báo trước 30 ngày nếu muốn chấm dứt hợp đồng sớm.\n` +
        `5. Không được tự ý sửa chữa, cải tạo phòng khi chưa có sự đồng ý của chủ trọ.`;

      await pool.request()
        .input('ma_dp',         sql.Int,               parseInt(req.params.id))
        .input('ma_phong',      sql.Int,               booking.ma_phong)
        .input('ma_nguoi_thue', sql.Int,               booking.ma_nguoi_thue)
        .input('ma_chu_tro',    sql.Int,               req.user.id)
        .input('ngay_bat_dau',  sql.Date,              booking.ngay_bat_dau)
        .input('ngay_ket_thuc', sql.Date,              booking.ngay_ket_thuc)
        .input('tien_thue',     sql.Decimal(12, 0),    booking.tien_thue)
        .input('tien_coc',      sql.Decimal(12, 0),    booking.tien_coc)
        .input('dieu_khoan',    sql.NVarChar(sql.MAX), defaultTerms)
        .query(`INSERT INTO hop_dong (ma_dp, ma_phong, ma_nguoi_thue, ma_chu_tro, ngay_bat_dau, ngay_ket_thuc, tien_thue, tien_coc, dieu_khoan)
                VALUES (@ma_dp, @ma_phong, @ma_nguoi_thue, @ma_chu_tro, @ngay_bat_dau, @ngay_ket_thuc, @tien_thue, @tien_coc, @dieu_khoan)`);
    }

    // Thông báo cho người thuê
    const msg = action === 'confirmed'
      ? `✅ Yêu cầu đặt phòng #${req.params.id} đã được xác nhận. Hợp đồng đã được tạo!`
      : `❌ Yêu cầu đặt phòng #${req.params.id} đã bị từ chối.`;

    await pool.request()
      .input('ma_nd',    sql.Int,           booking.ma_nguoi_thue)
      .input('noi_dung', sql.NVarChar(500), msg)
      .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'📋', @noi_dung)`);

    return res.json({ message: action === 'confirmed' ? 'Đã xác nhận và tạo hợp đồng' : 'Đã từ chối booking' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── EMPLOYER: Kích hoạt hợp đồng (đánh dấu active) ────────────────────────
// PUT /api/bookings/:id/activate
router.put('/:id/activate', auth(['employer']), async (req, res) => {
  try {
    await poolConnect;
    const check = await pool.request()
      .input('ma_dp',      sql.Int, req.params.id)
      .input('ma_chu_tro', sql.Int, req.user.id)
      .query(`SELECT ma_nguoi_thue FROM dat_phong
              WHERE ma_dp = @ma_dp AND ma_chu_tro = @ma_chu_tro AND trang_thai = 'confirmed'`);

    if (check.recordset.length === 0)
      return res.status(400).json({ message: 'Không thể kích hoạt booking này' });

    const ma_nguoi_thue = check.recordset[0].ma_nguoi_thue;

    await pool.request()
      .input('ma_dp', sql.Int, req.params.id)
      .query(`UPDATE dat_phong SET trang_thai = 'active' WHERE ma_dp = @ma_dp`);

    // Cập nhật trạng thái phòng → hết chỗ
    await pool.request()
      .input('ma_dp', sql.Int, req.params.id)
      .query(`UPDATE phong_tro SET con_phong = 0
              WHERE ma_phong = (SELECT ma_phong FROM dat_phong WHERE ma_dp = @ma_dp)`);

    await pool.request()
      .input('ma_nd',    sql.Int,           ma_nguoi_thue)
      .input('noi_dung', sql.NVarChar(500), `🏠 Hợp đồng thuê phòng #${req.params.id} đã bắt đầu hiệu lực!`)
      .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'🏠', @noi_dung)`);

    return res.json({ message: 'Đã kích hoạt hợp đồng' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── EMPLOYER: Kết thúc hợp đồng ────────────────────────────────────────────
// PUT /api/bookings/:id/end
router.put('/:id/end', auth(['employer']), async (req, res) => {
  try {
    await poolConnect;
    const check = await pool.request()
      .input('ma_dp',      sql.Int, req.params.id)
      .input('ma_chu_tro', sql.Int, req.user.id)
      .query(`SELECT ma_nguoi_thue, ma_phong FROM dat_phong
              WHERE ma_dp = @ma_dp AND ma_chu_tro = @ma_chu_tro AND trang_thai = 'active'`);

    if (check.recordset.length === 0)
      return res.status(400).json({ message: 'Không thể kết thúc booking này' });

    const { ma_nguoi_thue, ma_phong } = check.recordset[0];

    await pool.request()
      .input('ma_dp', sql.Int, req.params.id)
      .query(`UPDATE dat_phong SET trang_thai = 'ended' WHERE ma_dp = @ma_dp`);

    // Mở lại phòng
    await pool.request()
      .input('ma_phong', sql.Int, ma_phong)
      .query(`UPDATE phong_tro SET con_phong = 1 WHERE ma_phong = @ma_phong`);

    // Cập nhật hợp đồng
    await pool.request()
      .input('ma_dp', sql.Int, req.params.id)
      .query(`UPDATE hop_dong SET trang_thai = 'expired' WHERE ma_dp = @ma_dp`);

    await pool.request()
      .input('ma_nd',    sql.Int,           ma_nguoi_thue)
      .input('noi_dung', sql.NVarChar(500), `📝 Hợp đồng thuê phòng #${req.params.id} đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ!`)
      .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'📝', @noi_dung)`);

    return res.json({ message: 'Đã kết thúc hợp đồng' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── Lấy chi tiết booking + hợp đồng ────────────────────────────────────────
// GET /api/bookings/:id
router.get('/:id', auth(['user', 'employer', 'admin']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_dp', sql.Int, req.params.id)
      .query(`SELECT dp.*, p.tieu_de, p.dia_chi, p.tinh_thanh, p.loai_phong,
                     (SELECT TOP 1 duong_dan FROM anh_phong WHERE ma_phong = p.ma_phong AND la_anh_bia = 1) AS anh_bia,
                     nt.ho_ten AS ten_nguoi_thue, nt.dien_thoai AS sdt_nguoi_thue, nt.tai_khoan AS email_nguoi_thue,
                     nc.ho_ten AS ten_chu_tro, nc.dien_thoai AS sdt_chu_tro,
                     hd.ma_hd, hd.dieu_khoan, hd.trang_thai AS trang_thai_hd,
                     hd.chu_tro_ky, hd.nguoi_thue_ky, hd.ngay_ky
              FROM dat_phong dp
              JOIN phong_tro p    ON p.ma_phong = dp.ma_phong
              JOIN nguoi_dung nt  ON nt.ma_nd = dp.ma_nguoi_thue
              JOIN nguoi_dung nc  ON nc.ma_nd = dp.ma_chu_tro
              LEFT JOIN hop_dong hd ON hd.ma_dp = dp.ma_dp
              WHERE dp.ma_dp = @ma_dp`);

    if (!result.recordset[0])
      return res.status(404).json({ message: 'Không tìm thấy booking' });

    const b = result.recordset[0];
    // Kiểm tra quyền
    if (req.user.role !== 'admin' && b.ma_nguoi_thue !== req.user.id && b.ma_chu_tro !== req.user.id)
      return res.status(403).json({ message: 'Không có quyền xem' });

    return res.json({ booking: b });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
