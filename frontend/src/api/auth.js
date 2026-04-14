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
