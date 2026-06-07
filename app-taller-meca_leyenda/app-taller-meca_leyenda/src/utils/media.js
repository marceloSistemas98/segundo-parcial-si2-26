import { API_BASE_URL } from '../constants/api';

/** URL absoluta para archivos del API (FileField relativo o absoluto). */
export function resolveMediaUrl(fileField) {
  if (fileField == null || fileField === '') return null;
  const path = typeof fileField === 'string' ? fileField : String(fileField);
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
