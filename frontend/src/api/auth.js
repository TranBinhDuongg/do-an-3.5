const BASE = 'http://localhost:5000/api';

export async function loginApi(username, password, role) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
  return data; // { token, user }
}

export async function registerApi(name, username, password, phone, role = 'user') {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password, phone, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
  return data; // { token, user }
}

export async function forgotPasswordVerifyApi(username, phone) {
  const res = await fetch(`${BASE}/auth/forgot-password/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Xác minh thất bại');
  return data; // { userId, name }
}

export async function forgotPasswordResetApi(userId, password) {
  const res = await fetch(`${BASE}/auth/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
  return data;
}

export async function getProfileApi() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.user;
}

export async function updateProfileApi(payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.user;
}

export async function updateAvatarApi(avatar_url) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/profile/avatar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ avatar_url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.user;
}


export async function changePasswordApi(payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/profile/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}
