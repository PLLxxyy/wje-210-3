const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string, nickname: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, nickname }) }),
  getMe: () => request('/auth/me'),
  updateMe: (data: { nickname?: string; bio?: string }) =>
    request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  // Items
  getItems: (params: { category?: string; search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.category && params.category !== '全部') qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return request(`/items?${qs.toString()}`);
  },
  getItem: (id: number) => request(`/items/${id}`),
  createItem: (data: any) =>
    request('/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: number, data: any) =>
    request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id: number) =>
    request(`/items/${id}`, { method: 'DELETE' }),
  getMyItems: () => request('/items/user/mine'),
  getAvailableItems: () => request('/items/user/available'),

  // Exchanges
  createExchange: (data: { requested_item_id: number; offered_item_id: number }) =>
    request('/exchanges', { method: 'POST', body: JSON.stringify(data) }),
  getSentExchanges: () => request('/exchanges/sent'),
  getReceivedExchanges: () => request('/exchanges/received'),
  updateExchangeStatus: (id: number, status: string) =>
    request(`/exchanges/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  rateExchange: (id: number, score: number, comment: string) =>
    request(`/exchanges/${id}/rate`, { method: 'POST', body: JSON.stringify({ score, comment }) }),
  getExchangeHistory: () => request('/exchanges/history'),
};
