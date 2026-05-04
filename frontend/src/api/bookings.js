const BASE = 'http://localhost:5000/api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// ─── Bookings ────────────────────────────────────────────────────────────────
export async function createBookingApi(data) {
  const res = await fetch(`${BASE}/bookings`, {
    method: 'POST', headers: authHeader(), body: JSON.stringify(data),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function getMyBookingsApi() {
  const res = await fetch(`${BASE}/bookings/my`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function cancelBookingApi(id) {
  const res = await fetch(`${BASE}/bookings/${id}/cancel`, {
    method: 'PUT', headers: authHeader(),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function getEmployerBookingsApi(trang_thai = '') {
  const qs = trang_thai ? `?trang_thai=${trang_thai}` : '';
  const res = await fetch(`${BASE}/bookings/employer${qs}`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function respondBookingApi(id, action) {
  const res = await fetch(`${BASE}/bookings/${id}/respond`, {
    method: 'PUT', headers: authHeader(), body: JSON.stringify({ action }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function activateBookingApi(id) {
  const res = await fetch(`${BASE}/bookings/${id}/activate`, {
    method: 'PUT', headers: authHeader(),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function endBookingApi(id) {
  const res = await fetch(`${BASE}/bookings/${id}/end`, {
    method: 'PUT', headers: authHeader(),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function getBookingDetailApi(id) {
  const res = await fetch(`${BASE}/bookings/${id}`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

// ─── Contracts ───────────────────────────────────────────────────────────────
export async function getContractByBookingApi(bookingId) {
  const res = await fetch(`${BASE}/contracts/booking/${bookingId}`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function getMyContractsApi() {
  const res = await fetch(`${BASE}/contracts/my`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function updateContractTermsApi(id, dieu_khoan) {
  const res = await fetch(`${BASE}/contracts/${id}/terms`, {
    method: 'PUT', headers: authHeader(), body: JSON.stringify({ dieu_khoan }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function signContractApi(id) {
  const res = await fetch(`${BASE}/contracts/${id}/sign`, {
    method: 'PUT', headers: authHeader(),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

// ─── Maintenance ─────────────────────────────────────────────────────────────
export async function createMaintenanceApi(data) {
  const res = await fetch(`${BASE}/maintenance`, {
    method: 'POST', headers: authHeader(), body: JSON.stringify(data),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function getMyMaintenanceApi() {
  const res = await fetch(`${BASE}/maintenance/my`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function getEmployerMaintenanceApi(trang_thai = '') {
  const qs = trang_thai ? `?trang_thai=${trang_thai}` : '';
  const res = await fetch(`${BASE}/maintenance/employer${qs}`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

export async function updateMaintenanceApi(id, data) {
  const res = await fetch(`${BASE}/maintenance/${id}`, {
    method: 'PUT', headers: authHeader(), body: JSON.stringify(data),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.message);
  return d;
}

// ─── Review gate ─────────────────────────────────────────────────────────────
export async function checkRentedApi(roomId) {
  const res = await fetch(`${BASE}/reviews/check-rented/${roomId}`, { headers: authHeader() });
  const d = await res.json();
  if (!res.ok) return { daThue: false };
  return d;
}
