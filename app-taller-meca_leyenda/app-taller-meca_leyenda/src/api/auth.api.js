import client from './client';
import { APP } from '../constants/api';

export const authApi = {
  register: (payload) =>
    client.post(`${APP}/auth/register/`, payload),

  login: (username, password) =>
    client.post(`${APP}/auth/login/`, { username, password }),

  logout: (refresh) =>
    client.post(`${APP}/auth/logout/`, { refresh }),

  refreshToken: (refresh) =>
    client.post(`${APP}/auth/refresh/`, { refresh }),

  getProfile: () =>
    client.get(`${APP}/auth/profile/`),

  updateProfile: (data) =>
    client.put(`${APP}/auth/profile/`, data),

  updateFcmToken: (fcm_token) =>
    client.post(`${APP}/auth/fcm-token/`, { fcm_token }),

  changePassword: ({ old_password, new_password, new_password_confirm }) =>
    client.post(`${APP}/auth/change-password/`, {
      old_password,
      new_password,
      new_password_confirm,
    }),
};
