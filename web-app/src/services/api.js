import axios from 'axios';

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
// POINTING TO BACKEND (Defaults to localhost:5002/api for development)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
});

// ── INTERCEPTORS ──────────────────────────────────────────────────────────────

// Attach access token to every request for authenticated routes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh logic on 401 (Unauthorized)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // 🛡️ SKIP refresh logic for login/register/refresh endpoints to avoid infinite loops
    const isAuthPath = originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/refresh');

    // If the error is 401, not an auth path, and we haven't tried to refresh yet
    if (err.response?.status === 401 && !isAuthPath && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: refresh
        });

        // Store new tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        // Update header and retry the original request
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── AUTHENTICATION API ────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (d) => api.patch('/auth/update-password', d),
  verifyEmailOtp: (data) => api.post('/auth/verify-email-otp', data),
  // 2FA
  generate2FA: () => api.post('/auth/2fa/generate'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  login2FA: (d) => api.post('/auth/2fa/login', d),
  disable2FA: () => api.post('/auth/2fa/disable'),
  // Face ID
  enrollFace: (descriptor) => api.post('/auth/enroll-face', { descriptor }),
  verifyFace: (descriptor) => api.post('/auth/verify-face', { descriptor }),
};

// ── COMPLAINTS API ────────────────────────────────────────────────────────────
export const complaintsAPI = {
  // Uses multipart/form-data for evidence file uploads
  create: (fd) => api.post('/complaints', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (p) => api.get('/complaints', { params: p }),
  getOne: (id) => api.get(`/complaints/${id}`),
  getEvidence: (complaintId, filename) => api.get(`/complaints/${complaintId}/evidence/${encodeURIComponent(filename)}`, { responseType: 'blob' }),
  track: (id) => api.get(`/complaints/track/${id}`),
  publicSearch: (q) => api.get('/complaints/public/search', { params: { q } }),
  analyze: (text) => api.post('/complaints/analyze', { text }),
  updateStatus: (id, d) => api.patch(`/complaints/${id}/status`, d),
  delete: (id) => api.delete(`/complaints/${id}`),
  analyze: (text) => api.post('/complaints/analyze', { text }),
};

// ── ANALYTICS API ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  byCategory: () => api.get('/analytics/by-category'),
  trends: (m) => api.get('/analytics/trends', { params: { months: m } }),
  geographic: () => api.get('/analytics/geographic'),
  statusDist: () => api.get('/analytics/status-distribution'),
  financial: () => api.get('/analytics/financial'),
  mapPoints: () => api.get('/analytics/map-points'),
  publicMapPoints: () => api.get('/analytics/public/map-points'),
  linkAnalysis: () => api.get('/analytics/link-analysis'),
};

// ── ADMIN API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers: (p) => api.get('/admin/users', { params: p }),
  getUserStats: () => api.get('/admin/users/stats'),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  resetUserPassword: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  createUser: (data) => api.post('/admin/users', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  assignOfficer: (id, oId) => api.patch(`/admin/complaints/${id}/assign`, { officerId: oId }),
  mlStatus: () => api.get('/admin/ml-status'),
  systemStats: () => api.get('/admin/system-stats'),
  predict: (text) => api.post('/admin/predict', { text }),
  getCodebase: () => api.get('/admin/codebase'),
  getEmails: (p) => api.get('/admin/emails', { params: p }),
};

export const chatsAPI = {
  getMessages: (cId) => api.get(`/chats/${cId}`),
  sendMessage: (cId, d) => api.post(`/chats/${cId}`, d),
  getGlobal: () => api.get('/chats/global'),
  sendGlobal: (d) => api.post('/chats/global', d),
  getPrivate: (uId) => api.get(`/chats/private/${uId}`),
  sendPrivate: (uId, d) => api.post(`/chats/private/${uId}`, d),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  updateProfile: (fd) => api.patch('/users/profile', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getProfile: () => api.get('/users/profile'),
};

export default api;
