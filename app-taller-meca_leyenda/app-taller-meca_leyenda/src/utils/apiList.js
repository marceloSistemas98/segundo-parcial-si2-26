/**
 * Normaliza respuestas DRF paginadas ({ results }) o arrays; evita .map sobre objetos.
 */
export function normalizeListResponse(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}
