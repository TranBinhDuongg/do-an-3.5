import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import './Register.css';
import { registerApi } from '../../api/auth';

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ name: '', username: '', phone: '', password: '', confirm: '' });
  const [role, setRole] = useState('user');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.username || !form.password)
      return setError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
    if (form.password.length < 6)
      return setError('Mật khẩu phải có ít nhất 6 ký tự.');
    if (form.password !== form.confirm)
      return setError('Mật khẩu xác nhận không khớp.');
    if (!agreed)
      return setError('Bạn cần đồng ý với điều khoản sử dụng.');

    setLoading(true);
    try {
      const { token, user } = await registerApi(form.name, form.username, form.password, form.phone, role);
      localStorage.setItem('token', token);
      onLogin(user);
      navigate('/login', { state: { successMsg: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT - Hero */}
      <div className="login-left">
        <div className="login-left-inner">
          <div className="login-logo">
            <span className="login-logo-icon">🏠</span>
            <span className="login-logo-text">ThueNhaVN</span>
          </div>

          <div className="login-hero-text">
            <h1>Tham gia cộng đồng<br />ThueNhaVN</h1>
            <p>Đăng ký miễn phí và bắt đầu tìm kiếm hoặc đăng tin nhà cho thuê ngay hôm nay.</p>
          </div>

          <ul className="login-features">
            <li><span className="login-check">✓</span> Đăng ký nhanh, hoàn toàn miễn phí</li>
            <li><span className="login-check">✓</span> Tìm kiếm hàng nghìn nhà cho thuê uy tín</li>
            <li><span className="login-check">✓</span> Nhắn tin trực tiếp với chủ nhà</li>
          </ul>

          <div className="login-stats">
            <div className="login-stat">
              <strong>50K+</strong>
              <span>Nhà cho thuê</span>
            </div>
            <div className="login-stat">
              <strong>10K+</strong>
              <span>Chủ nhà</span>
            </div>
            <div className="login-stat">
              <strong>500K+</strong>
              <span>Người thuê</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="register-right">
        <div className="register-form-box">
          <h2 className="register-title">Tạo tài khoản</h2>
          <p className="register-sub">Điền thông tin để bắt đầu</p>

          {/* Role tabs */}
          <div className="login-role-tabs">
            <button
              type="button"
              className={`login-role-tab ${role === 'user' ? 'active' : ''}`}
              onClick={() => { setRole('user'); setError(''); }}
            >
              Người thuê
            </button>
            <button
              type="button"
              className={`login-role-tab ${role === 'employer' ? 'active' : ''}`}
              onClick={() => { setRole('employer'); setError(''); }}
            >
              Chủ nhà
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            {/* Họ tên + SĐT */}
            <div className="register-row">
              <div className="login-field">
                <label>Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">👤</span>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
              </div>
              <div className="login-field">
                <label>Số điện thoại</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">📱</span>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </div>
              </div>
            </div>

            {/* Tên tài khoản */}
            <div className="login-field">
              <label>Tên tài khoản <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔑</span>
                <input
                  type="text"
                  placeholder="Nhập tên tài khoản"
                  value={form.username}
                  onChange={set('username')}
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="login-field">
              <label>Mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Ít nhất 6 ký tự"
                  value={form.password}
                  onChange={set('password')}
                />
                <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="login-field">
              <label>Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirm}
                  onChange={set('confirm')}
                />
                <button type="button" className="login-eye" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Điều khoản */}
            <label className="register-terms">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span>Tôi đồng ý với <Link to="/terms">Điều khoản sử dụng</Link> và <Link to="/privacy">Chính sách bảo mật</Link></span>
            </label>

            <button type="submit" className="register-submit-btn" disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="register-login-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
