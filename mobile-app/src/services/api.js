import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper to determine the best backend URL automatically
export function getDefaultBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 1. Detect Expo Host IP (only if it's a valid local IP, NOT a tunnel hostname)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    const isTunnel = hostIp.includes('exp.direct') || hostIp.includes('ngrok') || hostIp.includes('expo.dev');
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1' && !isTunnel) {
      return `http://${hostIp}:5002/api`;
    }
  }

  // 2. Android emulator vs iOS simulator vs localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5002/api';
  }
  return 'http://localhost:5002/api';
}

export let BASE_URL = getDefaultBaseUrl();

const api = axios.create({ 
  baseURL: BASE_URL, 
  timeout: 15000,
  headers: {
    'bypass-tunnel-reminder': 'true',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': '69420',
    'User-Agent': 'CyberGuardMobile/2.0',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Initialize persisted custom URL if set
(async () => {
  try {
    const custom = await AsyncStorage.getItem('custom_api_url');
    if (custom && custom.trim()) {
      BASE_URL = custom.trim();
      api.defaults.baseURL = BASE_URL;
      console.log('⚡ Using custom API URL:', BASE_URL);
    } else {
      console.log('🌐 Using auto-detected API URL:', BASE_URL);
    }
  } catch (e) {
    console.warn('Could not load custom_api_url', e);
  }
})();

export async function setCustomApiUrl(url) {
  if (!url || !url.trim()) {
    await AsyncStorage.removeItem('custom_api_url');
    BASE_URL = getDefaultBaseUrl();
  } else {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    if (!clean.endsWith('/api')) {
      clean = clean.replace(/\/+$/, '') + '/api';
    }
    await AsyncStorage.setItem('custom_api_url', clean);
    BASE_URL = clean;
  }
  api.defaults.baseURL = BASE_URL;
  return BASE_URL;
}

export async function getActiveApiUrl() {
  try {
    const custom = await AsyncStorage.getItem('custom_api_url');
    return custom || BASE_URL;
  } catch {
    return BASE_URL;
  }
}

export async function testApiHealth() {
  const start = Date.now();
  try {
    const res = await api.get('/analytics/overview', { timeout: 8000 });
    const latency = Date.now() - start;
    return {
      success: true,
      latency,
      status: res.status,
      data: res.data?.data?.overview || null
    };
  } catch (err) {
    const latency = Date.now() - start;
    return {
      success: false,
      latency,
      error: err.response?.data?.message || err.message
    };
  }
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await AsyncStorage.getItem('refreshToken');
        if (refresh) {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh });
          await AsyncStorage.setItem('accessToken',  data.data.accessToken);
          await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        }
      } catch (refreshErr) {
        await AsyncStorage.multiRemove(['accessToken','refreshToken','user']);
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:      (d)    => api.post('/auth/register', d),
  login:         (d)    => api.post('/auth/login', d),
  logout:        ()     => api.post('/auth/logout'),
  getMe:         ()      => api.get('/auth/me'),
  registerPushToken: (token) => api.post('/users/push-token', { token }),
  updateProfile: (d)    => api.patch('/auth/profile', d),
};

export const complaintsAPI = {
  create:        (fd)   => api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll:        (p)    => api.get('/complaints', { params: p }),
  getOne:        (id)   => api.get(`/complaints/${id}`),
  track:         (id)   => api.get(`/complaints/track/${id}`),
  updateStatus:  (id, d)=> api.patch(`/complaints/${id}/status`, d),
  publicSearch:  (q)    => api.get('/complaints/public/search', { params: { query: q } }),
  delete:        (id)   => api.delete(`/complaints/${id}`),
};

export const analyticsAPI = {
  overview:        ()   => api.get('/analytics/overview'),
  byCategory:      ()   => api.get('/analytics/by-category'),
  trends:          (m)  => api.get('/analytics/trends', { params: { months: m } }),
  publicMapPoints: ()   => api.get('/analytics/map'),
};

export const adminAPI = {
  systemStats:   ()     => api.get('/admin/system-stats'),
  mlStatus:      ()     => api.get('/admin/ml-status'),
  getUsers:      (p)    => api.get('/admin/users', { params: p }),
  getSingleUser: (id)   => api.get(`/admin/users/${id}`),
  updateUser:    (id, d)=> api.patch(`/admin/users/${id}`, d),
  deleteUser:    (id)   => api.delete(`/admin/users/${id}`),
  emails:        ()     => api.get('/admin/emails'),
};

export const chatsAPI = {
  getGlobal:         ()     => api.get('/chats/global'),
  sendGlobal:        (d)    => api.post('/chats/global', d),
  getComplaintChats: (id)   => api.get(`/chats/complaint/${id}`),
  sendComplaintChat: (id, d)=> api.post(`/chats/complaint/${id}`, d),
};

export const jarvisAPI = {
  chat: (message, history) => api.post('/jarvis/chat', { message, history }),
};

export default api;
