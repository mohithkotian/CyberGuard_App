import { create } from 'zustand';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  user:    getStoredUser(),
  token:   localStorage.getItem('accessToken') || null,
  loading: false,
  error:   null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      
      if (data.status === 'email_otp_required') {
        set({ loading: false });
        return { emailOtpRequired: true, userId: data.data.userId, message: data.message };
      }

      if (data.status === 'mfa_required') {
        set({ loading: false });
        return { mfaRequired: true, userId: data.data.userId };
      }

      const { user, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken',  accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      connectSocket(user.id, user.role === 'admin');
      set({ user, token: accessToken, loading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  verifyEmailOtp: async (userId, otp) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.verifyEmailOtp({ userId, otp });
      const { user, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken',  accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      connectSocket(user.id, user.role === 'admin');
      set({ user, token: accessToken, loading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid OTP code';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  // verify2FA and verifyEmailOtp functions removed as OTP flow is disabled.

  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.register(formData);
      const { user, accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken',  accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      connectSocket(user.id, false);
      set({ user, token: accessToken, loading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    sessionStorage.clear();
    disconnectSocket();
    set({ user: null, token: null });
  },

  syncUser: async () => {
    try {
      const { data } = await authAPI.getMe();
      const user = data.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return user;
    } catch (err) {
      console.error("Failed to sync user data", err);
    }
  },

  clearError: () => set({ error: null }),

  isAdmin:   () => get().user?.role === 'admin',
  isOfficer: () => get().user?.role === 'officer',
}));

export default useAuthStore;
