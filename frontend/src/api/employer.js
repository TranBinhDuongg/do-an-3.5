const BASE = 'http://localhost:5000/api/employer';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDashboardApi() {
  const res = await fetch(`${BASE}/dashboard`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { stats, rooms, notifications, goi }
}

export async function getNotificationsApi() {
  const res = await fetch(`${BASE}/notifications`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { notifications }
}

export async function readAllNotificationsApi() {
  const res = await fetch(`${BASE}/notifications/read-all`, {
    method: 'POST',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function postRoomApi(payload) {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { message, roomId }
}

export async function getRoomsEmployerApi(status) {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`${BASE}/rooms${qs}`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { rooms }
}

export async function updateRoomStatusApi(roomId, status) {
  const res = await fetch(`${BASE}/rooms/${roomId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function deleteRoomApi(roomId) {
  const res = await fetch(`${BASE}/rooms/${roomId}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function getRoomDetailEmployerApi(roomId) {
  const res = await fetch(`${BASE}/rooms/${roomId}/detail`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { room }
}

export async function updateRoomApi(id, data) {
  const res = await fetch(`${BASE}/rooms/${id}`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json;
}

export async function pushRoomApi(id) {
  const res = await fetch(`${BASE}/rooms/${id}/push`, {
    method: 'POST',
    headers: authHeader()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json;
}

export async function getAnalyticsApi() {
  const res = await fetch('http://localhost:5000/api/analytics/employer', { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { stats, rooms, chartData, suggestions }
}
