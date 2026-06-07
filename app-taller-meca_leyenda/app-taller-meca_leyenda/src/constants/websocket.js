import { API_BASE_URL } from './api';

/** Convierte base HTTP(S) del API a WS(S) para Channels. */
export function getWebSocketRoot() {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (base.startsWith('https://')) {
    return base.replace('https://', 'wss://');
  }
  return base.replace('http://', 'ws://');
}

/**
 * URL del consumer `IncidentTrackingConsumer`.
 * @param {string|number} incidentId
 * @param {string} accessToken JWT access (sin prefijo Bearer)
 */
export function buildIncidentTrackingWsUrl(incidentId, accessToken) {
  const root = getWebSocketRoot();
  const tokenQ = accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
  return `${root}/ws/incident/${incidentId}/${tokenQ}`;
}
