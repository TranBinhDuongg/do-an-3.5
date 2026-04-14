import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { loginApi } from '../../api/auth';

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { token, user } = await loginApi(form.username, form.password, 'admin');
      localStorage.setItem('token', token);
      onLogin(user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <label>Tên tài khoản</label>
            <input type="text" placeholder="Nhập tên tài khoản"
              value={form.username}
              onChange={e => { setForm({ ...form, username: e.target.value }); setError(''); }} />
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

          <button type="submit" className="al-btn" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <Link to="/" className="al-back">← Về trang chủ</Link>
      </div>
    </div>
  );
}
