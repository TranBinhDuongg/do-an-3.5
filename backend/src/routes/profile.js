const express = require('express');
const { pool, poolConnect, sql } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/profile
router.get('/', auth(), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .execute('sp_GetProfile');

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/profile
router.put('/', auth(), async (req, res) => {
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên không được để trống' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('id',    sql.Int,      req.user.id)
      .input('name',  sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .execute('sp_UpdateProfile');

    return res.json({ message: 'Cập nhật thành công', user: result.recordset[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/profile/avatar
router.put('/avatar', auth(), async (req, res) => {
  const { avatar_url } = req.body;
  if (!avatar_url) return res.status(400).json({ message: 'Thiếu dữ liệu ảnh' });
  if (avatar_url.length > 10 * 1024 * 1024)
    return res.status(400).json({ message: 'Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn 2MB' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('id',         sql.Int,              req.user.id)
      .input('avatar_url', sql.NVarChar(sql.MAX), avatar_url)
      .execute('sp_UpdateAvatar');

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json({ message: 'Cập nhật avatar thành công', user });
  } catch (err) {
    console.error('[AVATAR ERROR]', err.message, err.stack);
    return res.status(500).json({ message: err.message || 'Lỗi server' });
  }
});

// PUT /api/profile/password
router.put('/password', auth(), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  if (newPassword.length < 6)
    return res.status(400).json({ message: 'Mật khẩu mới phải ít nhất 6 ký tự' });

  try {
    await poolConnect;

    // Verify mật khẩu hiện tại
    const check = await pool.request()
      .input('id', sql.Int, req.user.id)
      .execute('sp_GetPasswordById');

    const user = check.recordset[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    if (currentPassword !== user.password)
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });

    await pool.request()
      .input('id',          sql.Int,      req.user.id)
      .input('newPassword', sql.NVarChar, newPassword)
      .execute('sp_ChangePassword');

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
