import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth.api';
import { formatApiError } from '../utils/apiErrors';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    try {
      const { data } = await authApi.login(username, password);
      await SecureStore.setItemAsync('access_token', data.tokens.access);
      await SecureStore.setItemAsync('refresh_token', data.tokens.refresh);
      set({ user: data.user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      return {
        success: false,
        error: formatApiError(data ?? error.message),
      };
    }
  },

  register: async (userData) => {
    try {
      const { data } = await authApi.register(userData);
      await SecureStore.setItemAsync('access_token', data.tokens.access);
      await SecureStore.setItemAsync('refresh_token', data.tokens.refresh);
      set({ user: data.user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      return {
        success: false,
        error: formatApiError(data ?? error.message),
      };
    }
  },

  logout: async () => {
    try {
      const refresh = await SecureStore.getItemAsync('refresh_token');
      if (refresh) {
        await authApi.logout(refresh).catch(() => {});
      }
    } finally {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      set({ user: null, isAuthenticated: false });
    }
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const { data } = await authApi.getProfile();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),
}));
