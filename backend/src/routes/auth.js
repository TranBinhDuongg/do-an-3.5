const express = require('express');
const jwt     = require('jsonwebtoken');
const { pool, poolConnect, sql } = require('../config/db');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/login
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
      .execute('sp_GetUserByUsername');

    const user = result.recordset[0];

    if (!user)
      return res.status(401).json({ message: 'Tên tài khoản hoặc mật khẩu không đúng' });

    if (user.role !== role)
      return res.status(403).json({ message: `Tài khoản này không phải ${role === 'admin' ? 'quản trị viên' : role === 'employer' ? 'chủ trọ' : 'người thuê'}` });

    if (password !== user.password)
      return res.status(401).json({ message: 'Tên tài khoản hoặc mật khẩu không đúng' });

    const token = signToken(user);
    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, name: user.name, username: user.username, phone: user.phone, role: user.role, avatar_url: user.avatar_url },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, username, password, phone, role = 'user' } = req.body;

  if (!name || !username || !password)
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

  if (!['user', 'employer'].includes(role))
    return res.status(400).json({ message: 'Role không hợp lệ' });

  try {
    await poolConnect;
    const insert = await pool.request()
      .input('name',     sql.NVarChar, name)
      .input('username', sql.NVarChar, username)
      .input('phone',    sql.NVarChar, phone || null)
      .input('password', sql.NVarChar, password)
      .input('role',     sql.NVarChar, role)
      .execute('sp_RegisterUser');

    const newUser = insert.recordset[0];
    const token   = signToken(newUser);
    return res.status(201).json({ message: 'Đăng ký thành công', token, user: newUser });
  } catch (err) {
    if (err.message?.includes('USERNAME_EXISTS'))
      return res.status(409).json({ message: 'Tên tài khoản đã được sử dụng' });
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/auth/me
const auth = require('../middleware/auth');
router.get('/me', auth(), async (req, res) => {
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

module.exports = router;
