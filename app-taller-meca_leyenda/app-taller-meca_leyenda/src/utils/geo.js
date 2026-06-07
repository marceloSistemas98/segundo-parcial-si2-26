/**
 * Normaliza lat/lng desde API (string, Decimal) y corrige orden invertido típico en datos erróneos.
 * Latitud ∈ [-90, 90], longitud ∈ [-180, 180].
 */
export function parseLatLng(latRaw, lngRaw) {
  let lat = typeof latRaw === 'string' ? parseFloat(latRaw) : Number(latRaw);
  let lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat: null, lng: null };
  }
  // Si parece que vinieron como lng,lat (ej. |lat| > 90)
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    const t = lat;
    lat = lng;
    lng = t;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { lat: null, lng: null };
  }
  // “Null Island” / placeholder: suele aparecer cuando el GPS aún no tiene fix o hay error.
  if (Math.abs(lat) < 1e-5 && Math.abs(lng) < 1e-5) {
    return { lat: null, lng: null };
  }
  return { lat, lng };
}
