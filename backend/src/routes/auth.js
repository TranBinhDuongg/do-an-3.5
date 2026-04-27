const express = require('express');
const jwt     = require('jsonwebtoken');
const { pool, poolConnect, sql } = require('../config/db');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.ma_nd, name: user.ho_ten, username: user.tai_khoan, role: user.vai_tro },
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
      .input('tai_khoan', sql.NVarChar, username)
      .execute('sp_LayNguoiDungTheoTaiKhoan');

    const user = result.recordset[0];

    if (!user || password !== user.mat_khau)
      return res.status(401).json({ message: 'Tên tài khoản hoặc mật khẩu không đúng' });

    if (user.vai_tro !== role)
      return res.status(401).json({ message: 'Tên tài khoản hoặc mật khẩu không đúng' });

    const token = signToken(user);
    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id:         user.ma_nd,
        name:       user.ho_ten,
        username:   user.tai_khoan,
        phone:      user.dien_thoai,
        role:       user.vai_tro,
        avatar_url: user.anh_dai_dien,
      },
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
      .input('ho_ten',     sql.NVarChar, name)
      .input('tai_khoan',  sql.NVarChar, username)
      .input('dien_thoai', sql.NVarChar, phone || null)
      .input('mat_khau',   sql.NVarChar, password)
      .input('vai_tro',    sql.NVarChar, role)
      .execute('sp_DangKyNguoiDung');

    const nd = insert.recordset[0];
    const token = signToken(nd);
    return res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: { id: nd.ma_nd, name: nd.ho_ten, username: nd.tai_khoan, role: nd.vai_tro },
    });
  } catch (err) {
    if (err.message?.includes('USERNAME_EXISTS'))
      return res.status(409).json({ message: 'Tên tài khoản đã được sử dụng' });
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/auth/forgot-password/verify  — xác minh tài khoản + SĐT
router.post('/forgot-password/verify', async (req, res) => {
  const { username, phone } = req.body;
  if (!username || !phone)
    return res.status(400).json({ message: 'Vui lòng nhập tên tài khoản và số điện thoại' });
  try {
    await poolConnect;
    const result = await pool.request()
      .input('tai_khoan',  sql.NVarChar, username)
      .input('dien_thoai', sql.NVarChar, phone)
      .execute('sp_XacMinhQuenMatKhau');
    const user = result.recordset[0];
    if (!user) return res.status(404).json({ message: 'Thông tin không khớp với bất kỳ tài khoản nào' });
    return res.json({ message: 'Xác minh thành công', userId: user.ma_nd, name: user.ho_ten });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/auth/forgot-password/reset  — đặt lại mật khẩu
router.post('/forgot-password/reset', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password)
    return res.status(400).json({ message: 'Thiếu thông tin' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  try {
    await poolConnect;
    await pool.request()
      .input('ma_nd',        sql.Int,      userId)
      .input('mat_khau_moi', sql.NVarChar, password)
      .execute('sp_DatLaiMatKhau');
    return res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/auth/me
const auth = require('../middleware/auth');
const passport = require('passport');

// GET /api/auth/google
router.get('/google', (req, res, next) => {
  const role = ['user', 'employer'].includes(req.query.role) ? req.query.role : 'user';
  passport.authenticate('google', { scope: ['profile', 'email'], state: role })(req, res, next);
});

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.ma_nd, name: user.ho_ten, username: user.tai_khoan, role: user.vai_tro },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    const userData = encodeURIComponent(JSON.stringify({
      id:         user.ma_nd,
      name:       user.ho_ten,
      username:   user.tai_khoan,
      phone:      user.dien_thoai,
      role:       user.vai_tro,
      avatar_url: user.anh_dai_dien,
    }));
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?token=${token}&user=${userData}`);
  }
);
router.get('/me', auth(), async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('ma_nd', sql.Int, req.user.id)
      .execute('sp_LayHoSo');

    const nd = result.recordset[0];
    if (!nd) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json({
      user: {
        id:         nd.ma_nd,
        name:       nd.ho_ten,
        username:   nd.tai_khoan,
        phone:      nd.dien_thoai,
        role:       nd.vai_tro,
        avatar_url: nd.anh_dai_dien,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
