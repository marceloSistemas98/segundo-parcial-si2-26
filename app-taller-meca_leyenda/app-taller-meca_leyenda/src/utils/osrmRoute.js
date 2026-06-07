/** Línea recta origen → destino (fallback si OSRM falla o sin red). [lat,lng][] */
export function straightLineRoute(fromLat, fromLng, toLat, toLng) {
  const a = Number(fromLat);
  const b = Number(fromLng);
  const c = Number(toLat);
  const d = Number(toLng);
  if (![a, b, c, d].every((x) => Number.isFinite(x))) {
    return null;
  }
  return [
    [a, b],
    [c, d],
  ];
}

/**
 * Ruta en carretera vía OSRM público (OpenStreetMap).
 * Convierte geometría GeoJSON [lng,lat] → [lat,lng] para Leaflet.
 */
export async function fetchOsrmDrivingRoute(fromLat, fromLng, toLat, toLng) {
  const a = Number(fromLat);
  const b = Number(fromLng);
  const c = Number(toLat);
  const d = Number(toLng);
  if (![a, b, c, d].every((x) => Number.isFinite(x))) {
    return null;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${b},${a};${d},${c}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const route = json.routes?.[0];
    if (!route) return null;
    const coords = route.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const latLngs = coords.map((pair) => {
      const lng = pair[0];
      const lat = pair[1];
      return [lat, lng];
    });
    return {
      coordinates: latLngs,
      distanceM: route.distance,
      durationS: route.duration,
    };
  } catch {
    return null;
  }
}

export function formatRouteSummary(distanceM, durationS) {
  if (!Number.isFinite(distanceM) && !Number.isFinite(durationS)) return null;
  const parts = [];
  if (Number.isFinite(distanceM)) {
    if (distanceM >= 1000) {
      parts.push(`${(distanceM / 1000).toFixed(1)} km`);
    } else {
      parts.push(`${Math.round(distanceM)} m`);
    }
  }
  if (Number.isFinite(durationS) && durationS > 0) {
    const min = Math.round(durationS / 60);
    parts.push(min < 1 ? '< 1 min' : `~${min} min`);
  }
  return parts.join(' · ');
}
