import client from '../../api/client';
import { APP } from '../../constants/api';

const BASE = `${APP}/technician`;

export const technicianApi = {
  listAssignments: (params = {}) => client.get(`${BASE}/assignments/`, { params }),

  getAssignment: (id) => client.get(`${BASE}/assignments/${id}/`),

  updateAssignmentStatus: (id, payload) =>
    client.patch(`${BASE}/assignments/${id}/status/`, payload),
};
