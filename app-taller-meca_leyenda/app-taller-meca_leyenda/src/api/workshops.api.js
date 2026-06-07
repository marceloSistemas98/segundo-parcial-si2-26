import client from './client';
import { APP } from '../constants/api';

export const workshopsApi = {
  // Corrección: el backend Django espera lat, lng como query params
  getNearby: (latitude, longitude, radius = 20) =>
    client.get(`${APP}/workshops/nearby/`, {
      params: { lat: latitude, lng: longitude, radius },
    }),

  getById: (id) =>
    client.get(`${APP}/workshops/${id}/`),

  /** Calificar un servicio concreto (requiere assignment_id del backend Fase 9). */
  rate: (workshopId, { assignment_id, score, comment = '' }) =>
    client.post(`${APP}/workshops/${workshopId}/rate/`, {
      assignment_id,
      score,
      comment,
    }),
};
