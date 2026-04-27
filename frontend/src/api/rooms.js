const BASE = 'http://localhost:5000/api/rooms';
const FAV_BASE = 'http://localhost:5000/api/favorites';

export async function getHomeDataApi() {
  const res = await fetch(`${BASE}/home`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { newRooms, featuredRooms, stats }
}

export async function getRoomsApi(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  const res = await fetch(`${BASE}?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { rooms, total, page, totalPages }
}

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getFavoritesApi() {
  const res = await fetch(FAV_BASE, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { rooms }
}

export async function addFavoriteApi(roomId) {
  const res = await fetch(`${FAV_BASE}/${roomId}`, {
    method: 'POST',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function removeFavoriteApi(roomId) {
  const res = await fetch(`${FAV_BASE}/${roomId}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function checkFavoriteApi(roomId) {
  const res = await fetch(`${FAV_BASE}/check/${roomId}`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { saved: bool }
}

export async function getRoomDetailApi(roomId) {
  const res = await fetch(`${BASE}/${roomId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { room, related }
}
