import client from './client';
import { APP } from '../constants/api';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

export const notificationsApi = {
  getAll: () =>
    client.get(`${APP}/notifications/`),

  markAsRead: (id) =>
    client.post(`${APP}/notifications/${id}/read/`),

  markAllAsRead: () =>
    client.post(`${APP}/notifications/read-all/`),

  getUnreadCount: () =>
    client.get(`${APP}/notifications/unread-count/`),

  getIncidentStreamUrl: async (incidentId) => {
    const token = await SecureStore.getItemAsync('access_token');
    const base = API_BASE_URL.replace(/\/$/, '');
    const safeId = encodeURIComponent(String(incidentId));
    const safeToken = encodeURIComponent(token || '');
    return `${base}${APP}/notifications/incidents/${safeId}/stream/?token=${safeToken}`;
  },
};
