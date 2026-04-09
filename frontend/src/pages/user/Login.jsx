import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    onLogin({ name: 'Nguyễn Văn A', email: form.email, role });
    navigate('/');
  };

  return (
    <div className="login-page">
      {/* LEFT - Hero */}
      <div className="login-left">
        <div className="login-left-inner">
          <div className="login-logo">
            <span className="login-logo-icon">🏠</span>
            <span className="login-logo-text">PhòngTrọVN</span>
          </div>

          <div className="login-hero-text">
            <h1>Tìm phòng trọ<br />mơ ước của bạn</h1>
            <p>Kết nối hàng nghìn chủ trọ uy tín với người thuê tài năng trên toàn quốc.</p>
          </div>

          <ul className="login-features">
            <li><span className="login-check">✓</span> Hơn 10.000 phòng trọ mới mỗi tháng</li>
            <li><span className="login-check">✓</span> Kết nối trực tiếp với chủ trọ</li>
            <li><span className="login-check">✓</span> Tìm kiếm nhanh chóng, miễn phí</li>
          </ul>

          <div className="login-stats">
            <div className="login-stat">
              <strong>50K+</strong>
              <span>Phòng trọ</span>
            </div>
            <div className="login-stat">
              <strong>10K+</strong>
              <span>Chủ trọ</span>
            </div>
            <div className="login-stat">
              <strong>500K+</strong>
              <span>Người thuê</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT - Form */}
      <div className="login-right">
        <div className="login-form-box">
          <h2 className="login-title">Đăng nhập</h2>
          <p className="login-sub">Chào mừng bạn quay trở lại</p>

          {/* Role tabs */}
          <div className="login-role-tabs">
            <button
              type="button"
              className={`login-role-tab ${role === 'user' ? 'active' : ''}`}
              onClick={() => setRole('user')}
            >
              Người thuê
            </button>
            <button
              type="button"
              className={`login-role-tab ${role === 'owner' ? 'active' : ''}`}
              onClick={() => setRole('owner')}
            >
              Chủ trọ
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">✉</span>
                <input
                  type="email"
                  placeholder="Nhập địa chỉ email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="login-field">
              <label>Mật khẩu</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" /> Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="login-forgot">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="login-submit-btn">Đăng nhập</button>
          </form>

          <div className="login-divider">
            <span>hoặc đăng nhập với</span>
          </div>

          <div className="login-socials">
            <button className="login-social-btn">
              <img src="https://www.google.com/favicon.ico" width={16} alt="Google" />
              Google
            </button>
            <button className="login-social-btn">
              <span style={{ color: '#1877f2', fontWeight: 800, fontSize: 16 }}>f</span>
              Facebook
            </button>
          </div>

          <p className="login-register-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
