import client from './client';
import { APP } from '../constants/api';

export const paymentsApi = {
  createIntent: (data) => {
    // Acepta objeto { assignment_id, payment_method_id? } o solo assignment_id
    const payload = typeof data === 'object' ? data : { assignment_id: data };
    return client.post(`${APP}/payments/create-intent/`, payload);
  },

  confirm: (payment_intent_id) =>
    client.post(`${APP}/payments/confirm/`, { payment_intent_id }),

  getHistory: () =>
    client.get(`${APP}/payments/history/`),

  getById: (id) =>
    client.get(`${APP}/payments/${id}/`),
};
