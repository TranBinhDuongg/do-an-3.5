const BASE = 'http://localhost:5000/api/wallet';
const ADMIN_BASE = 'http://localhost:5000/api/admin';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function getBalanceApi() {
  const res = await fetch(`${BASE}/balance`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { so_du }
}

export async function getTransactionsApi({ loai, tu_ngay, den_ngay, trang = 1, gioi_han = 10 } = {}) {
  const params = new URLSearchParams();
  if (loai)     params.set('loai', loai);
  if (tu_ngay)  params.set('tu_ngay', tu_ngay);
  if (den_ngay) params.set('den_ngay', den_ngay);
  params.set('trang', trang);
  params.set('gioi_han', gioi_han);
  const res = await fetch(`${BASE}/transactions?${params}`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { transactions, tong_so, trang, gioi_han }
}

export async function getTransactionsSummaryApi() {
  const res = await fetch(`${BASE}/transactions/summary`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { tong_nap, tong_chi, tong_hoan, tong_gd, cho_xu_ly }
}

export async function topupApi(so_tien, phuong_thuc) {
  const res = await fetch(`${BASE}/topup`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ so_tien, phuong_thuc }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { message, ma_gd, bank_info }
}

export async function purchasePackageApi(ma_goi) {
  const res = await fetch(`${BASE}/purchase`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ ma_goi }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { message, so_du_moi }
}

// Admin APIs
export async function adminGetTopupsApi(trang_thai = null) {
  const url = trang_thai
    ? `${ADMIN_BASE}/topups?trang_thai=${trang_thai}`
    : `${ADMIN_BASE}/topups`;
  const res = await fetch(url, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function adminApproveTopupApi(id, ma_tham_chieu = '') {
  const res = await fetch(`${ADMIN_BASE}/topups/${id}/approve`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ ma_tham_chieu }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function adminRejectTopupApi(id) {
  const res = await fetch(`${ADMIN_BASE}/topups/${id}/reject`, {
    method: 'POST',
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function adminGetRevenueApi() {
  const res = await fetch(`${ADMIN_BASE}/revenue`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function getPackagesApi() {
  const res = await fetch(`${BASE}/packages`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { packages }
}

export async function getMyPackageApi() {
  const res = await fetch(`${BASE}/my-package`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { package }
}
