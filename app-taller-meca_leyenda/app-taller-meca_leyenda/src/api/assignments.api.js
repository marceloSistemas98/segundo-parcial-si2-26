import client from './client';
import { APP } from '../constants/api';

export const assignmentsApi = {
  getById: (id) =>
    client.get(`${APP}/assignments/${id}/`),

  /** Asignación activa de un incidente (backend: incident/<id>/active/) */
  getActiveForIncident: (incidentId) =>
    client.get(`${APP}/assignments/incident/${incidentId}/active/`),
};
