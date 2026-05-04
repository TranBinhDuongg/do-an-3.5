const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/check-rented/:roomId - Kiểm tra user đã từng thuê phòng chưa
router.get('/check-rented/:roomId', auth(['user']), async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  if (isNaN(roomId)) return res.status(400).json({ message: 'ID không hợp lệ' });
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .input('ma_nd',    sql.Int, req.user.id)
      .query(`SELECT 1 AS da_thue FROM dat_phong
              WHERE ma_phong = @ma_phong AND ma_nguoi_thue = @ma_nd AND trang_thai = 'ended'`);
    return res.json({ daThue: result.recordset.length > 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/reviews/:roomId - Lấy danh sách đánh giá
router.get('/:roomId', async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  if (isNaN(roomId)) return res.status(400).json({ message: 'ID không hợp lệ' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .query(`
        SELECT
          dg.ma_dg, dg.so_sao, dg.noi_dung, dg.ngay_tao,
          nd.ho_ten, nd.anh_dai_dien
        FROM danh_gia dg
        JOIN nguoi_dung nd ON nd.ma_nd = dg.ma_nd
        WHERE dg.ma_phong = @ma_phong
        ORDER BY dg.ngay_tao DESC
      `);

    const stats = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .query(`
        SELECT
          COUNT(*) AS tong_so,
          AVG(CAST(so_sao AS FLOAT)) AS trung_binh
        FROM danh_gia
        WHERE ma_phong = @ma_phong
      `);

    return res.json({
      reviews: result.recordset.map(r => ({
        id:        r.ma_dg,
        stars:     r.so_sao,
        content:   r.noi_dung,
        createdAt: r.ngay_tao,
        userName:  r.ho_ten,
        userAvatar: r.anh_dai_dien,
      })),
      total:   stats.recordset[0].tong_so,
      average: stats.recordset[0].trung_binh
        ? parseFloat(stats.recordset[0].trung_binh.toFixed(1))
        : 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/reviews/:roomId - Gửi đánh giá (cần đăng nhập)
router.post('/:roomId', auth(['user']), async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  if (isNaN(roomId)) return res.status(400).json({ message: 'ID không hợp lệ' });

  const { stars, content } = req.body;
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ message: 'Số sao không hợp lệ (1-5)' });

  try {
    await poolConnect;

    // Kiểm tra phòng tồn tại
    const roomCheck = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .query(`SELECT ma_phong FROM phong_tro WHERE ma_phong = @ma_phong AND trang_thai = 'approved'`);
    if (!roomCheck.recordset.length)
      return res.status(404).json({ message: 'Không tìm thấy phòng' });

    // Kiểm tra đã từng thuê phòng này chưa (phải có booking ended)
    const rentedCheck = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .input('ma_nd',    sql.Int, req.user.id)
      .query(`SELECT 1 FROM dat_phong
              WHERE ma_phong = @ma_phong AND ma_nguoi_thue = @ma_nd AND trang_thai = 'ended'`);
    if (!rentedCheck.recordset.length)
      return res.status(403).json({ message: 'Bạn chỉ có thể đánh giá phòng đã từng thuê' });

    // Kiểm tra đã đánh giá chưa
    const existing = await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .input('ma_nd', sql.Int, req.user.id)
      .query(`SELECT ma_dg FROM danh_gia WHERE ma_phong = @ma_phong AND ma_nd = @ma_nd`);
    if (existing.recordset.length)
      return res.status(409).json({ message: 'Bạn đã đánh giá phòng này rồi' });

    await pool.request()
      .input('ma_phong',  sql.Int,      roomId)
      .input('ma_nd',     sql.Int,      req.user.id)
      .input('so_sao',    sql.TinyInt,  parseInt(stars))
      .input('noi_dung',  sql.NVarChar, content?.trim() || null)
      .query(`
        INSERT INTO danh_gia (ma_phong, ma_nd, so_sao, noi_dung)
        VALUES (@ma_phong, @ma_nd, @so_sao, @noi_dung)
      `);

    return res.json({ message: 'Đánh giá thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/reviews/:roomId - Sửa đánh giá của mình
router.put('/:roomId', auth(['user']), async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  if (isNaN(roomId)) return res.status(400).json({ message: 'ID không hợp lệ' });

  const { stars, content } = req.body;
  if (!stars || stars < 1 || stars > 5)
    return res.status(400).json({ message: 'Số sao không hợp lệ (1-5)' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_phong', sql.Int,      roomId)
      .input('ma_nd',    sql.Int,      req.user.id)
      .input('so_sao',   sql.TinyInt,  parseInt(stars))
      .input('noi_dung', sql.NVarChar, content?.trim() || null)
      .query(`
        UPDATE danh_gia SET so_sao = @so_sao, noi_dung = @noi_dung
        WHERE ma_phong = @ma_phong AND ma_nd = @ma_nd
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

    return res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/reviews/:roomId - Xóa đánh giá của mình
router.delete('/:roomId', auth(['user']), async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  if (isNaN(roomId)) return res.status(400).json({ message: 'ID không hợp lệ' });

  try {
    await poolConnect;
    await pool.request()
      .input('ma_phong', sql.Int, roomId)
      .input('ma_nd',    sql.Int, req.user.id)
      .query(`DELETE FROM danh_gia WHERE ma_phong = @ma_phong AND ma_nd = @ma_nd`);

    return res.json({ message: 'Đã xóa đánh giá' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
