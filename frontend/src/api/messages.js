const BASE = 'http://localhost:5000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Lấy danh sách cuộc trò chuyện
export async function getConversationsApi() {
  const res = await fetch(`${BASE}/messages`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi tải tin nhắn');
  return data.conversations;
}

// Lấy tin nhắn trong cuộc trò chuyện
export async function getMessagesApi(conversationId) {
  const res = await fetch(`${BASE}/messages/${conversationId}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi tải tin nhắn');
  return data.messages;
}

// Gửi tin nhắn vào cuộc trò chuyện đã có
export async function sendMessageApi(conversationId, noi_dung) {
  const res = await fetch(`${BASE}/messages/${conversationId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ noi_dung }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi gửi tin nhắn');
  return data.message;
}

// Tạo cuộc trò chuyện mới và gửi tin nhắn đầu tiên
export async function startConversationApi(ma_doi_phuong, noi_dung, ma_phong = null) {
  const res = await fetch(`${BASE}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ma_doi_phuong, noi_dung, ma_phong }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi tạo cuộc trò chuyện');
  return data; // { ma_ctc, message }
}
