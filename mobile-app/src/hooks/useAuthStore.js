import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { registerForPushNotifications } from '../services/notifications';

const clearStoredSession = async () => {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
};

const parseStoredUser = (rawUser) => {
  if (!rawUser || rawUser === 'undefined' || rawUser === 'null') return null;
  try { return JSON.parse(rawUser); } catch (_) { return null; }
};

const registerPushTokenSafely = () => {
  registerForPushNotifications().catch(() => {
    // Push registration is non-critical and must not block authentication.
  });
};

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const [rawUser, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('accessToken'),
      ]);
      const storedUser = parseStoredUser(rawUser);

      if (!storedUser || !token) {
        set({ user: null, token: null, hydrated: true });
        return;
      }

      try {
        const { data } = await authAPI.getMe();
        const user = data.data.user;
        const currentToken = await AsyncStorage.getItem('accessToken');
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, token: currentToken || token, hydrated: true });
        registerPushTokenSafely();
      } catch (err) {
        if (err.response?.status === 401) {
          await clearStoredSession();
          set({ user: null, token: null, hydrated: true });
        } else {
          // Keep the local session only when the server cannot be reached.
          set({ user: storedUser, token, hydrated: true });
        }
      }
    } catch (_) {
      await clearStoredSession();
      set({ user: null, token: null, hydrated: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login({ email, password });
      const { user, accessToken, refreshToken } = data.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, loading: false });
      registerPushTokenSafely();
      return user;
    } catch (err) {
      set({ loading: false });
      const msg = err.response?.data?.message || (err.message === 'Network Error' ? 'Cannot reach backend server. Please verify the server is running on port 5002.' : err.message) || 'Login failed';
      throw new Error(msg);
    }
  },

  register: async (form) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.register(form);
      const { user, accessToken, refreshToken } = data.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, loading: false });
      registerPushTokenSafely();
      return user;
    } catch (err) {
      set({ loading: false });
      const msg = err.response?.data?.message || (err.message === 'Network Error' ? 'Cannot reach backend server. Please verify the server is running on port 5002.' : err.message) || 'Registration failed';
      throw new Error(msg);
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch (_) {}
    await clearStoredSession();
    set({ user: null, token: null });
  },

  isAdmin: () => ['admin', 'officer'].includes(get().user?.role),
  isOfficer: () => get().user?.role === 'officer',
}));

export default useAuthStore;
