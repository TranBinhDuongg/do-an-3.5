const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── USER: Gửi báo cáo sự cố ─────────────────────────────────────────────────
// POST /api/maintenance
router.post('/', auth(['user']), async (req, res) => {
  const { ma_hd, tieu_de, mo_ta, muc_do } = req.body;
  if (!ma_hd || !tieu_de || !mo_ta)
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

  const validMucDo = ['low', 'medium', 'high', 'urgent'];
  const mucDoFinal = validMucDo.includes(muc_do) ? muc_do : 'medium';

  try {
    await poolConnect;
    // Kiểm tra hợp đồng thuộc về user và đang active
    const hdRes = await pool.request()
      .input('ma_hd', sql.Int, ma_hd)
      .input('ma_nd', sql.Int, req.user.id)
      .query(`SELECT hd.ma_hd, hd.ma_phong, hd.ma_chu_tro, dp.trang_thai
              FROM hop_dong hd
              JOIN dat_phong dp ON dp.ma_dp = hd.ma_dp
              WHERE hd.ma_hd = @ma_hd AND hd.ma_nguoi_thue = @ma_nd`);

    const hd = hdRes.recordset[0];
    if (!hd) return res.status(404).json({ message: 'Không tìm thấy hợp đồng' });
    if (hd.trang_thai !== 'active') return res.status(400).json({ message: 'Chỉ có thể báo cáo khi hợp đồng đang hiệu lực' });

    const result = await pool.request()
      .input('ma_hd',        sql.Int,          ma_hd)
      .input('ma_phong',     sql.Int,          hd.ma_phong)
      .input('ma_nguoi_bao', sql.Int,          req.user.id)
      .input('tieu_de',      sql.NVarChar(200), tieu_de)
      .input('mo_ta',        sql.NVarChar(sql.MAX), mo_ta)
      .input('muc_do',       sql.NVarChar(20), mucDoFinal)
      .query(`INSERT INTO bao_cao_su_co (ma_hd, ma_phong, ma_nguoi_bao, tieu_de, mo_ta, muc_do)
              OUTPUT INSERTED.ma_bc
              VALUES (@ma_hd, @ma_phong, @ma_nguoi_bao, @tieu_de, @mo_ta, @muc_do)`);

    const ma_bc = result.recordset[0].ma_bc;

    // Thông báo chủ trọ
    const icon = mucDoFinal === 'urgent' ? '🚨' : '🔧';
    await pool.request()
      .input('ma_nd',    sql.Int,          hd.ma_chu_tro)
      .input('noi_dung', sql.NVarChar(500), `${icon} Báo cáo sự cố mới: "${tieu_de}" (mức độ: ${mucDoFinal})`)
      .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'${icon}', @noi_dung)`);

    return res.status(201).json({ message: 'Đã gửi báo cáo sự cố', ma_bc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── USER: Lấy danh sách báo cáo của mình ────────────────────────────────────
// GET /api/maintenance/my
router.get('/my', auth(['user']), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .query(`SELECT bc.ma_bc, bc.tieu_de, bc.mo_ta, bc.muc_do, bc.trang_thai,
                     bc.phan_hoi, bc.ngay_tao, bc.ngay_cap_nhat,
                     p.tieu_de AS ten_phong, p.dia_chi
              FROM bao_cao_su_co bc
              JOIN phong_tro p ON p.ma_phong = bc.ma_phong
              WHERE bc.ma_nguoi_bao = @ma_nd
              ORDER BY bc.ngay_tao DESC`);

    return res.json({ reports: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── EMPLOYER: Lấy danh sách báo cáo cho phòng của mình ─────────────────────
// GET /api/maintenance/employer
router.get('/employer', auth(['employer']), async (req, res) => {
  const { trang_thai } = req.query;
  try {
    await poolConnect;
    const req1 = pool.request().input('ma_chu_tro', sql.Int, req.user.id);
    let whereStatus = '';
    if (trang_thai) {
      req1.input('trang_thai', sql.NVarChar(20), trang_thai);
      whereStatus = 'AND bc.trang_thai = @trang_thai';
    }
    const result = await req1.query(`
      SELECT bc.ma_bc, bc.tieu_de, bc.mo_ta, bc.muc_do, bc.trang_thai,
             bc.phan_hoi, bc.ngay_tao, bc.ngay_cap_nhat,
             p.tieu_de AS ten_phong, p.dia_chi,
             nd.ho_ten AS ten_nguoi_bao, nd.dien_thoai AS sdt_nguoi_bao
      FROM bao_cao_su_co bc
      JOIN phong_tro p   ON p.ma_phong = bc.ma_phong
      JOIN nguoi_dung nd ON nd.ma_nd = bc.ma_nguoi_bao
      JOIN hop_dong hd   ON hd.ma_hd = bc.ma_hd
      WHERE hd.ma_chu_tro = @ma_chu_tro ${whereStatus}
      ORDER BY
        CASE bc.muc_do WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        bc.ngay_tao DESC`);

    return res.json({ reports: result.recordset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─── EMPLOYER: Cập nhật trạng thái + phản hồi ────────────────────────────────
// PUT /api/maintenance/:id
router.put('/:id', auth(['employer']), async (req, res) => {
  const { trang_thai, phan_hoi } = req.body;
  const validStatus = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatus.includes(trang_thai))
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_bc',     sql.Int,               req.params.id)
      .input('ma_chu_tro',sql.Int,               req.user.id)
      .input('trang_thai',sql.NVarChar(20),      trang_thai)
      .input('phan_hoi',  sql.NVarChar(sql.MAX), phan_hoi || null)
      .query(`UPDATE bc SET bc.trang_thai = @trang_thai, bc.phan_hoi = @phan_hoi, bc.ngay_cap_nhat = GETDATE()
              OUTPUT INSERTED.ma_nguoi_bao, INSERTED.tieu_de
              FROM bao_cao_su_co bc
              JOIN hop_dong hd ON hd.ma_hd = bc.ma_hd
              WHERE bc.ma_bc = @ma_bc AND hd.ma_chu_tro = @ma_chu_tro`);

    if (result.recordset.length === 0)
      return res.status(400).json({ message: 'Không tìm thấy báo cáo' });

    const { ma_nguoi_bao, tieu_de } = result.recordset[0];
    const statusLabel = { open: 'Mở', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết', closed: 'Đã đóng' };

    await pool.request()
      .input('ma_nd',    sql.Int,          ma_nguoi_bao)
      .input('noi_dung', sql.NVarChar(500), `🔧 Báo cáo "${tieu_de}" đã được cập nhật: ${statusLabel[trang_thai]}`)
      .query(`INSERT INTO thong_bao (ma_nd, bieu_tuong, noi_dung) VALUES (@ma_nd, N'🔧', @noi_dung)`);

    return res.json({ message: 'Đã cập nhật báo cáo' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
