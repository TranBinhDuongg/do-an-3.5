const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── Lấy hợp đồng theo booking ───────────────────────────────────────────────
// GET /api/contracts/booking/:bookingId
router.get('/booking/:bookingId', auth(['user', 'employer']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_dp', sql.Int, req.params.bookingId)
      .query(`SELECT hd.*, p.tieu_de, p.dia_chi, p.tinh_thanh, p.loai_phong,
                     nt.ho_ten AS ten_nguoi_thue, nt.dien_thoai AS sdt_nguoi_thue, nt.tai_khoan AS email_nguoi_thue,
                     nc.ho_ten AS ten_chu_tro, nc.dien_thoai AS sdt_chu_tro, nc.tai_khoan AS email_chu_tro
              FROM hop_dong hd
              JOIN phong_tro p   ON p.ma_phong = hd.ma_phong
              JOIN nguoi_dung nt ON nt.ma_nd = hd.ma_nguoi_thue
              JOIN nguoi_dung nc ON nc.ma_nd = hd.ma_chu_tro
              WHERE hd.ma_dp = @ma_dp`);

    if (!result.recordset[0])
      return res.status(404).json({ message: 'Chưa có hợp đồng' });

    const hd = result.recordset[0];
    if (hd.ma_nguoi_thue !== req.user.id && hd.ma_chu_tro !== req.user.id)
      return res.status(403).json({ message: 'Không có quyền xem' });

    return res.json({ contract: hd });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── Employer cập nhật điều khoản hợp đồng ───────────────────────────────────
// PUT /api/contracts/:id/terms
router.put('/:id/terms', auth(['employer']), async (req, res) => {
  const { dieu_khoan } = req.body;
  if (!dieu_khoan) return res.status(400).json({ message: 'Thiếu điều khoản' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_hd',     sql.Int,               req.params.id)
      .input('ma_chu_tro',sql.Int,               req.user.id)
      .input('dieu_khoan',sql.NVarChar(sql.MAX), dieu_khoan)
      .query(`UPDATE hop_dong SET dieu_khoan = @dieu_khoan
              OUTPUT INSERTED.ma_hd
              WHERE ma_hd = @ma_hd AND ma_chu_tro = @ma_chu_tro AND trang_thai = 'draft'`);

    if (result.recordset.length === 0)
      return res.status(400).json({ message: 'Không thể cập nhật hợp đồng này' });

    return res.json({ message: 'Đã cập nhật điều khoản' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── Ký hợp đồng ─────────────────────────────────────────────────────────────
// PUT /api/contracts/:id/sign
router.put('/:id/sign', auth(['user', 'employer']), async (req, res) => {
  try {
    await poolConnect;
    const hdRes = await pool.request()
      .input('ma_hd', sql.Int, req.params.id)
      .query(`SELECT * FROM hop_dong WHERE ma_hd = @ma_hd`);

    const hd = hdRes.recordset[0];
    if (!hd) return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
    if (hd.trang_thai !== 'draft') return res.status(400).json({ message: 'Hợp đồng không ở trạng thái chờ ký' });

    let updateQuery = '';
    let notifyId = null;
    let notifyMsg = '';

    if (req.user.role === 'employer' && hd.ma_chu_tro === req.user.id) {
      updateQuery = `UPDATE hop_dong SET chu_tro_ky = 1 WHERE ma_hd = @ma_hd`;
      notifyId  = hd.ma_nguoi_thue;
      notifyMsg = `📝 Chủ trọ đã ký hợp đồng #${req.params.id}. Vui lòng xem và ký xác nhận.`;
    } else if (req.user.role === 'user' && hd.ma_nguoi_thue === req.user.id) {
      updateQuery = `UPDATE hop_dong SET nguoi_thue_ky = 1 WHERE ma_hd = @ma_hd`;
      notifyId  = hd.ma_chu_tro;
      notifyMsg = `✅ Người thuê đã ký hợp đồng #${req.params.id}.`;
    } else {
      return res.status(403).json({ message: 'Không có quyền ký hợp đồng này' });
    }

    await pool.request().input('ma_hd', sql.Int, req.params.id).query(updateQuery);

    // Kiểm tra cả hai đã ký chưa
    const checkRes = await pool.request()
      .input('ma_hd', sql.Int, req.params.id)
      .query(`SELECT chu_tro_ky, nguoi_thue_ky FROM hop_dong WHERE ma_hd = @ma_hd`);

    const updated = checkRes.recordset[0];
    if (updated.chu_tro_ky && updated.nguoi_thue_ky) {
      await pool.request()
        .input('ma_hd', sql.Int, req.params.id)
        .query(`UPDATE hop_dong SET trang_thai = 'signed', ngay_ky = GETDATE() WHERE ma_hd = @ma_hd`);
      notifyMsg = `🎉 Hợp đồng #${req.params.id} đã được ký bởi cả hai bên!`;
      // Thông báo cả hai
      await pool.request()
        .input('ma_nd', sql.Int, hd.ma_nguoi_thue)
        .input('noi_dung', sql.NVarChar(500), notifyMsg)
        .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'🎉', @noi_dung)`);
      await pool.request()
        .input('ma_nd', sql.Int, hd.ma_chu_tro)
        .input('noi_dung', sql.NVarChar(500), notifyMsg)
        .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'🎉', @noi_dung)`);
    } else if (notifyId) {
      await pool.request()
        .input('ma_nd',    sql.Int,          notifyId)
        .input('noi_dung', sql.NVarChar(500), notifyMsg)
        .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'📝', @noi_dung)`);
    }

    return res.json({ message: 'Đã ký hợp đồng', bothSigned: updated.chu_tro_ky && updated.nguoi_thue_ky });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── Lấy danh sách hợp đồng của user/employer ────────────────────────────────
// GET /api/contracts/my
router.get('/my', auth(['user', 'employer']), async (req, res) => {
  try {
    await poolConnect;
    const field = req.user.role === 'employer' ? 'hd.ma_chu_tro' : 'hd.ma_nguoi_thue';
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .query(`SELECT hd.ma_hd, hd.trang_thai, hd.ngay_bat_dau, hd.ngay_ket_thuc,
                     hd.tien_thue, hd.tien_coc, hd.chu_tro_ky, hd.nguoi_thue_ky, hd.ngay_ky,
                     hd.ma_dp, p.tieu_de, p.tinh_thanh,
                     nt.ho_ten AS ten_nguoi_thue, nc.ho_ten AS ten_chu_tro
              FROM hop_dong hd
              JOIN phong_tro p   ON p.ma_phong = hd.ma_phong
              JOIN nguoi_dung nt ON nt.ma_nd = hd.ma_nguoi_thue
              JOIN nguoi_dung nc ON nc.ma_nd = hd.ma_chu_tro
              WHERE ${field} = @ma_nd
              ORDER BY hd.ngay_tao DESC`);

    return res.json({ contracts: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
