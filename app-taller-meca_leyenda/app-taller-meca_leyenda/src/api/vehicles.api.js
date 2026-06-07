import client from './client';
import { postMultipart } from './multipartUpload';
import { APP } from '../constants/api';

export const vehiclesApi = {
  getAll: () =>
    client.get(`${APP}/vehicles/`),

  create: (payload) => {
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      return postMultipart(`${APP}/vehicles/`, payload);
    }
    return client.post(`${APP}/vehicles/`, payload);
  },

  getById: (id) =>
    client.get(`${APP}/vehicles/${id}/`),

  update: (id, payload) =>
    client.patch(`${APP}/vehicles/${id}/`, payload),

  delete: (id) =>
    client.delete(`${APP}/vehicles/${id}/`),
};
