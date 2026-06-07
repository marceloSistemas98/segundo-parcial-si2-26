import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE_URL, APP } from '../constants/api';

const MULTIPART_TIMEOUT_MS = 120000;

async function refreshAccessToken() {
  const refresh = await SecureStore.getItemAsync('refresh_token');
  if (!refresh) {
    const e = new Error('Sesión expirada');
    e.response = { status: 401, data: {} };
    throw e;
  }
  const { data } = await axios.post(`${API_BASE_URL}${APP}/auth/refresh/`, {
    refresh,
  });
  await SecureStore.setItemAsync('access_token', data.access);
  return data.access;
}

/**
 * POST multipart con fetch. En React Native, Axios (XHR) suele fallar con FormData/archivos → "Network Error".
 */
export async function postMultipart(relativePath, formData) {
  if (!API_BASE_URL) {
    const e = new Error('API_BASE_URL no configurada');
    e.response = { status: 0, data: { detail: 'Configura EXPO_PUBLIC_API_URL o extra.apiUrl' } };
    throw e;
  }

  const url = /^https?:\/\//i.test(relativePath)
    ? relativePath
    : `${API_BASE_URL.replace(/\/$/, '')}${
        relativePath.startsWith('/') ? relativePath : `/${relativePath}`
      }`;

  const exec = async (token) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MULTIPART_TIMEOUT_MS);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let token = await SecureStore.getItemAsync('access_token');
  let res = await exec(token);

  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
      res = await exec(token);
    } catch (e) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      throw e;
    }
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.response = { status: res.status, data };
    throw err;
  }

  if (res.status === 204 || data === null) {
    return { data: null };
  }

  return { data };
}
