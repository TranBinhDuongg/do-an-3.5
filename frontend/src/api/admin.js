const BASE = 'http://localhost:5000/api/admin';

function authHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi server');
  return data;
}

// Lấy danh sách tin đăng (có filter + phân trang)
// params: { status, keyword, city, type, page }
export async function adminGetRoomsApi(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return handle(await fetch(`${BASE}/rooms?${qs}`, { headers: authHeader() }));
}

// Lấy thống kê số lượng theo trạng thái
export async function adminGetRoomStatsApi() {
  return handle(await fetch(`${BASE}/rooms/stats`, { headers: authHeader() }));
}

// Lấy chi tiết một tin đăng
export async function adminGetRoomDetailApi(id) {
  return handle(await fetch(`${BASE}/rooms/${id}`, { headers: authHeader() }));
}

// Cập nhật trạng thái tin đăng
// status: 'approved' | 'rejected' | 'paused' | 'pending'
export async function adminUpdateRoomStatusApi(id, status) {
  return handle(await fetch(`${BASE}/rooms/${id}/status`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ status }),
  }));
}

// Xóa tin đăng
export async function adminDeleteRoomApi(id) {
  return handle(await fetch(`${BASE}/rooms/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  }));
}

// ── User Management ──────────────────────────────────────────

// Lấy danh sách người dùng
// params: { role, keyword, page }
export async function adminGetUsersApi(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return handle(await fetch(`${BASE}/users?${qs}`, { headers: authHeader() }));
}

// Thống kê người dùng
export async function adminGetUserStatsApi() {
  return handle(await fetch(`${BASE}/users/stats`, { headers: authHeader() }));
}

// Chi tiết người dùng
export async function adminGetUserDetailApi(id) {
  return handle(await fetch(`${BASE}/users/${id}`, { headers: authHeader() }));
}

// Khóa / mở khóa tài khoản
export async function adminUpdateUserStatusApi(id, active) {
  return handle(await fetch(`${BASE}/users/${id}/status`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ active }),
  }));
}
