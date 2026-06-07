import client from './client';
import { postMultipart } from './multipartUpload';
import { APP } from '../constants/api';

export const incidentsApi = {
  create: (payload) =>
    client.post(`${APP}/incidents/`, payload),

  getAll: (params = {}) =>
    client.get(`${APP}/incidents/`, { params }),

  getById: (id) =>
    client.get(`${APP}/incidents/${id}/`),

  getAssignment: (id) =>
    client.get(`${APP}/incidents/${id}/assignment/`),

  cancel: (id) =>
    client.post(`${APP}/incidents/${id}/cancel/`),

  getStatusHistory: (id) =>
    client.get(`${APP}/incidents/${id}/status-history/`),

  uploadEvidence: (incidentId, formData) =>
    postMultipart(`${APP}/incidents/${incidentId}/upload-evidence/`, formData),

  getEvidences: (incidentId) =>
    client.get(`${APP}/incidents/${incidentId}/evidences/`),

  getOfferedWorkshops: (incidentId) =>
    client.get(`${APP}/incidents/${incidentId}/offered-workshops/`),

  refreshWorkshopOffers: (incidentId) =>
    client.post(`${APP}/incidents/${incidentId}/refresh-workshop-offers/`),

  selectWorkshop: (incidentId, assignmentId) =>
    client.post(`${APP}/incidents/${incidentId}/select-workshop/`, {
      assignment_id: assignmentId,
    }),

  getQuotes: (incidentId) =>
    client.get(`${APP}/incidents/${incidentId}/quotes/`),

  respondQuote: (incidentId, quoteId, action) =>
    client.post(`${APP}/incidents/${incidentId}/quotes/respond/`, {
      quote_id: quoteId,
      action,
    }),
};
