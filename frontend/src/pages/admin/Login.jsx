import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.email !== 'admin@phongtrovn.com' || form.password !== 'admin123') {
      setError('Email hoặc mật khẩu không đúng.');
      return;
    }
    onLogin({ name: 'Admin', email: form.email, role: 'admin' });
    navigate('/admin/dashboard');
  };

  return (
    <div className="al-page">
      <div className="al-box">
        <div className="al-logo">⚙️</div>
        <h1 className="al-title">Quản trị viên</h1>
        <p className="al-sub">Đăng nhập để quản lý hệ thống</p>

        {error && <div className="al-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="al-form">
          <div className="al-field">
            <label>Email</label>
            <input type="email" placeholder="admin@phongtrovn.com"
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }} />
          </div>

          <div className="al-field">
            <label>Mật khẩu</label>
            <div className="al-pw-wrap">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }} />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="al-btn">Đăng nhập</button>
        </form>

        <Link to="/" className="al-back">← Về trang chủ</Link>
      </div>
    </div>
  );
}
