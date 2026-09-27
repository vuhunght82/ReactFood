// Định nghĩa cổng và địa chỉ server Backend Node.js của bạn
export const API_BASE_URL = 'http://localhost:3000'; 

// Hàm hỗ trợ gọi fetch nhanh chóng kèm tiền tố cổng 3000
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
};