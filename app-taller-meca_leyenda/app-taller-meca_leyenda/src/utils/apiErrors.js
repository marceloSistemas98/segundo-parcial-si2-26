/**
 * Convierte respuestas 4xx de DRF en un mensaje legible para Toast.
 */
export function formatApiError(data) {
  if (data == null) return 'Error desconocido';
  if (typeof data === 'string') return data;
  if (typeof data.error === 'string') return data.error;
  if (data.detail != null) return String(data.detail);

  const messages = [];
  for (const [, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length) {
      messages.push(String(value[0]));
    } else if (typeof value === 'string') {
      messages.push(value);
    } else if (value && typeof value === 'object') {
      const nested = formatApiError(value);
      if (nested && nested !== 'Error desconocido') messages.push(nested);
    }
  }
  return messages.length ? messages.join(' ') : 'Error en la solicitud';
}
