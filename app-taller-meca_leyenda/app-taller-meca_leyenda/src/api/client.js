import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, APP } from '../constants/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inyecta JWT
client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Multipart: quitar Content-Type para que Axios añada boundary (fijarlo a mano rompe RN → Network Error).
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: renueva token si 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = await SecureStore.getItemAsync('refresh_token');
      if (!refresh) {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}${APP}/auth/refresh/`, {
          refresh,
        });

        await SecureStore.setItemAsync('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        return client(originalRequest);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
