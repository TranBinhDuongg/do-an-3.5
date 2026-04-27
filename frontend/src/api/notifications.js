const BASE = 'http://localhost:5000/api/notifications';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getNotificationsApi() {
  const res = await fetch(BASE, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { notifications }
}

export async function readAllNotificationsApi() {
  const res = await fetch(`${BASE}/read-all`, {
    method: 'POST',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function readOneNotificationApi(id) {
  const res = await fetch(`${BASE}/read/${id}`, {
    method: 'POST',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}
