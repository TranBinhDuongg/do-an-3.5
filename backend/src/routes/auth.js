const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool, poolConnect, sql } = require('../config/db');

const router = express.Router();

// Hàm tạo JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password, role }
// role: 'user' | 'employer' | 'admin'
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role)
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

  if (!['user', 'employer', 'admin'].includes(role))
    return res.status(400).json({ message: 'Role không hợp lệ' });

  try {
    await poolConnect;
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM users WHERE username = @username AND is_active = 1');

    const user = result.recordset[0];

    if (!user)
      return res.status(401).json({ message: 'Tên tài khoản hoặc mật khẩu không đúng' });

    if (user.role !== role)
      return res.status(403).json({ message: `Tài khoản này không phải ${role === 'admin' ? 'quản trị viên' : role === 'employer' ? 'chủ trọ' : 'người thuê'}` });

    const isMatch = password === user.password;
    if (!isMatch)
      return res.status(401).json({ message: 'Tên tài khoản hoặc mật khẩu không đúng' });

    const token = signToken(user);

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id:        user.id,
        name:      user.name,
        username:  user.username,
        phone:     user.phone,
        role:      user.role,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, phone, role }
// role: 'user' | 'employer'  (admin không tự đăng ký)
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, username, password, phone, role = 'user' } = req.body;

  if (!name || !username || !password)
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

  if (!['user', 'employer'].includes(role))
    return res.status(400).json({ message: 'Role không hợp lệ' });

  try {
    await poolConnect;

    const check = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM users WHERE username = @username');

    if (check.recordset.length > 0)
      return res.status(409).json({ message: 'Tên tài khoản đã được sử dụng' });

    const hashed = password; // plain text for development

    const insert = await pool.request()
      .input('name',     sql.NVarChar, name)
      .input('username', sql.NVarChar, username)
      .input('phone',    sql.NVarChar, phone || null)
      .input('password', sql.NVarChar, hashed)
      .input('role',     sql.NVarChar, role)
      .query(`
        INSERT INTO users (name, username, phone, password, role)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.username, INSERTED.role
        VALUES (@name, @username, @phone, @password, @role)
      `);

    const newUser = insert.recordset[0];
    const token   = signToken(newUser);

    return res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me  (cần token)
// ─────────────────────────────────────────────
const auth = require('../middleware/auth');

router.get('/me', auth(), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT id, name, username, phone, role, avatar_url FROM users WHERE id = @id');

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
