import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfileApi, updateProfileApi, changePasswordApi, updateAvatarApi } from '../api/auth';
import './Profile.css';

export default function Profile({ user, onLogin, onLogout }) {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    getProfileApi()
      .then(u => {
        setForm({ name: u.name || '', phone: u.phone || '' });
        if (u.avatar_url) setAvatarPreview(u.avatar_url);
      })
      .catch(err => {
        if (err.message === 'Chưa đăng nhập' || err.message === 'Token không hợp lệ') {
          navigate('/login');
        } else {
          showMsg('error', err.message || 'Không thể tải thông tin hồ sơ');
        }
      });
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showMsg('error', 'Tên không được để trống');
    setLoading(true);
    try {
      const updated = await updateProfileApi({ name: form.name, phone: form.phone });
      onLogin({ ...user, name: updated.name });
      showMsg('success', 'Cập nhật thông tin thành công');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return showMsg('error', 'Mật khẩu xác nhận không khớp');
    if (pwForm.newPassword.length < 6)
      return showMsg('error', 'Mật khẩu mới phải ít nhất 6 ký tự');
    setLoading(true);
    try {
      await changePasswordApi({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMsg('success', 'Đổi mật khẩu thành công');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showMsg('error', 'Vui lòng chọn file ảnh');
    if (file.size > 4 * 1024 * 1024) return showMsg('error', 'Ảnh phải nhỏ hơn 4MB');
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setLoading(true);
    try {
      const updated = await updateAvatarApi(avatarPreview);
      onLogin({ ...user, avatar_url: updated.avatar_url });
      showMsg('success', 'Cập nhật ảnh đại diện thành công');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      const updated = await updateAvatarApi('');
      onLogin({ ...user, avatar_url: '' });
      setAvatarPreview(null);
      showMsg('success', 'Đã xóa ảnh đại diện');
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const backPath = user?.role === 'employer' ? '/employer' : '/';
  const initials = user?.name?.charAt(0) || '?';

  return (
    <div className="prof-page">
      <nav className="prof-nav">
        <Link to={backPath} className="prof-nav-logo">🏠 PhòngTrọ<span>VN</span></Link>
        <div className="prof-nav-right">
          <Link to={backPath} className="prof-nav-back">← Quay lại</Link>
          <button className="prof-nav-logout" onClick={() => { onLogout(); navigate('/login'); }}>
            🚪 Đăng xuất
          </button>
        </div>
      </nav>

      <div className="prof-body">
        <aside className="prof-sidebar">
          <div className="prof-avatar-wrap">
            <div className="prof-avatar-big">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="prof-avatar-img" />
                : initials}
            </div>
            <h3>{user?.name}</h3>
            <span className={`prof-role-badge ${user?.role}`}>
              {user?.role === 'employer' ? '🏠 Chủ trọ' : user?.role === 'admin' ? '⚙️ Admin' : '👤 Người thuê'}
            </span>
          </div>
          <nav className="prof-side-nav">
            <button className={`prof-side-item ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
              👤 Thông tin cá nhân
            </button>
            <button className={`prof-side-item ${tab === 'avatar' ? 'active' : ''}`} onClick={() => setTab('avatar')}>
              🖼️ Ảnh đại diện
            </button>
            <button className={`prof-side-item ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
              🔒 Đổi mật khẩu
            </button>
          </nav>
        </aside>

        <div className="prof-main">
          {msg.text && (
            <div className={`prof-msg ${msg.type}`}>
              {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
            </div>
          )}

          {tab === 'info' && (
            <div className="prof-card">
              <h2 className="prof-card-title">👤 Thông tin cá nhân</h2>
              <form onSubmit={handleUpdateInfo} className="prof-form">
                <div className="prof-field">
                  <label>Tên hiển thị</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Nhập tên của bạn" />
                </div>
                <div className="prof-field">
                  <label>Tên tài khoản</label>
                  <input type="text" value={user?.username || ''} disabled className="prof-input-disabled" />
                  <span className="prof-hint">Tên tài khoản không thể thay đổi</span>
                </div>
                <div className="prof-field">
                  <label>Số điện thoại</label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="VD: 0912 345 678" />
                </div>
                <div className="prof-field">
                  <label>Vai trò</label>
                  <input type="text"
                    value={user?.role === 'employer' ? 'Chủ trọ' : user?.role === 'admin' ? 'Quản trị viên' : 'Người thuê'}
                    disabled className="prof-input-disabled" />
                </div>
                <button type="submit" className="prof-btn-save" disabled={loading}>
                  {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
              </form>
            </div>
          )}

          {tab === 'avatar' && (
            <div className="prof-card">
              <h2 className="prof-card-title">🖼️ Ảnh đại diện</h2>
              <div className="prof-avatar-editor">
                <div className="prof-avatar-preview">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="preview" />
                    : <div className="prof-avatar-placeholder">{initials}</div>}
                </div>
                <div className="prof-avatar-actions">
                  <p className="prof-hint">Chọn ảnh JPG, PNG. Tối đa 4MB.</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button className="prof-btn-choose" onClick={() => fileRef.current.click()}>
                    📁 Chọn ảnh
                  </button>
                  <button className="prof-btn-save" onClick={handleSaveAvatar} disabled={loading || !avatarPreview}>
                    {loading ? 'Đang lưu...' : '💾 Lưu ảnh'}
                  </button>
                  {avatarPreview && (
                    <button className="prof-btn-remove" onClick={handleRemoveAvatar} disabled={loading}>
                      🗑️ Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div className="prof-card">
              <h2 className="prof-card-title">🔒 Đổi mật khẩu</h2>
              <form onSubmit={handleChangePassword} className="prof-form">
                <div className="prof-field">
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    placeholder="Nhập mật khẩu hiện tại" />
                </div>
                <div className="prof-field">
                  <label>Mật khẩu mới</label>
                  <input type="password" value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="Ít nhất 6 ký tự" />
                </div>
                <div className="prof-field">
                  <label>Xác nhận mật khẩu mới</label>
                  <input type="password" value={pwForm.confirmPassword}
                    onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới" />
                </div>
                <button type="submit" className="prof-btn-save" disabled={loading}>
                  {loading ? 'Đang lưu...' : '🔒 Đổi mật khẩu'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
