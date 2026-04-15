const BASE = 'http://localhost:5000/api/rooms';

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
