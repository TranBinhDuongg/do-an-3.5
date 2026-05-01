import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import './ForgotPassword.css';
import { forgotPasswordVerifyApi, forgotPasswordResetApi } from '../../api/auth';

// step: 'verify' | 'reset' | 'done'
export default function ForgotPassword() {
  const [step, setStep]         = useState('verify');
  const [username, setUsername] = useState('');
  const [phone, setPhone]       = useState('');
  const [userId, setUserId]     = useState(null);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !phone) return setError('Vui lòng nhập đầy đủ thông tin.');
    setLoading(true);
    try {
      const data = await forgotPasswordVerifyApi(username, phone);
      setUserId(data.userId);
      setUserName(data.name);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) return setError('Vui lòng nhập mật khẩu mới.');
    if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp.');
    setLoading(true);
    try {
      await forgotPasswordResetApi(userId, password);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT */}
      <div className="login-left">
        <div className="login-left-inner">
          <div className="login-logo">
            <span className="login-logo-icon">🏠</span>
            <span className="login-logo-text">ThueNhaVN</span>
          </div>
          <div className="login-hero-text">
            <h1>Khôi phục<br />tài khoản của bạn</h1>
            <p>Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập chỉ trong vài bước đơn giản.</p>
          </div>
          <ul className="login-features">
            <li><span className="login-check">✓</span> Xác minh qua số điện thoại đã đăng ký</li>
            <li><span className="login-check">✓</span> Đặt mật khẩu mới an toàn</li>
            <li><span className="login-check">✓</span> Đăng nhập lại ngay lập tức</li>
          </ul>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-form-box">

          {/* Step indicators */}
          <div className="fp-steps">
            {['Xác minh', 'Mật khẩu mới', 'Hoàn tất'].map((label, i) => {
              const idx = i + 1;
              const stepMap = { verify: 1, reset: 2, done: 3 };
              const current = stepMap[step];
              const state = idx < current ? 'done' : idx === current ? 'active' : 'pending';
              return (
                <div key={i} className={`fp-step fp-step--${state}`}>
                  <div className="fp-step-dot">{idx < current ? '✓' : idx}</div>
                  <span>{label}</span>
                  {i < 2 && <div className={`fp-step-line ${idx < current ? 'done' : ''}`} />}
                </div>
              );
            })}
          </div>

          {/* STEP 1: Verify */}
          {step === 'verify' && (
            <>
              <h2 className="login-title">Quên mật khẩu</h2>
              <p className="login-sub">Nhập tên tài khoản và số điện thoại đã đăng ký</p>
              {error && <div className="login-error">{error}</div>}
              <form onSubmit={handleVerify} className="login-form">
                <div className="login-field">
                  <label>Tên tài khoản</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">👤</span>
                    <input
                      type="text"
                      placeholder="Nhập tên tài khoản"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="login-field">
                  <label>Số điện thoại</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">📱</span>
                    <input
                      type="tel"
                      placeholder="Số điện thoại đã đăng ký"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Đang xác minh...' : 'Xác minh tài khoản'}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: Reset */}
          {step === 'reset' && (
            <>
              <h2 className="login-title">Đặt mật khẩu mới</h2>
              <p className="login-sub">
                Xin chào <strong style={{ color: '#60a5fa' }}>{userName}</strong>, hãy tạo mật khẩu mới
              </p>
              {error && <div className="login-error">{error}</div>}
              <form onSubmit={handleReset} className="login-form">
                <div className="login-field">
                  <label>Mật khẩu mới</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">🔒</span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Ít nhất 6 ký tự"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="login-field">
                  <label>Xác nhận mật khẩu</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">🔒</span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                    />
                    <button type="button" className="login-eye" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                </button>
              </form>
            </>
          )}

          {/* STEP 3: Done */}
          {step === 'done' && (
            <div className="fp-done">
              <div className="fp-done-icon">✅</div>
              <h2 className="login-title">Thành công!</h2>
              <p className="login-sub">Mật khẩu của bạn đã được đặt lại. Hãy đăng nhập với mật khẩu mới.</p>
              <button className="login-submit-btn" onClick={() => navigate('/login')}>
                Đăng nhập ngay
              </button>
            </div>
          )}

          <p className="login-register-link" style={{ marginTop: 20 }}>
            <Link to="/login">← Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
