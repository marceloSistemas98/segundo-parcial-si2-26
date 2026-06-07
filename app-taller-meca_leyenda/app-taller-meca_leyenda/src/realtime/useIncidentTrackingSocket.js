import { useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { buildIncidentTrackingWsUrl } from '../constants/websocket';
import { parseLatLng } from '../utils/geo';

const DEFAULT_BROADCAST_MS = 10_000;

function hasUsableGps(lat, lng) {
  const p = parseLatLng(lat, lng);
  return p.lat != null && p.lng != null;
}

function wsDebug(...args) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log('[incident-tracking-ws]', ...args);
  }
}

/**
 * WebSocket de tracking por incidente (Django Channels + Daphne/ASGI).
 * - listen: recibe `technician_location` (+ mensaje inicial `connected`)
 * - broadcast: al abrir el socket, pide permiso y envía GPS cada `locationPingMs` (10s por defecto)
 *
 * Requiere servidor ASGI (p. ej. `daphne -b 0.0.0.0 -p 8080 config.asgi:application`), no solo `runserver` WSGI.
 */
export function useIncidentTrackingSocket({
  incidentId,
  mode = 'listen',
  enabled = true,
  onTechnicianLocation,
  onConnected,
  locationPingMs = DEFAULT_BROADCAST_MS,
}) {
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const onLocRef = useRef(onTechnicianLocation);
  const onConnectedRef = useRef(onConnected);
  const modeRef = useRef(mode);
  const pingMsRef = useRef(locationPingMs);
  onLocRef.current = onTechnicianLocation;
  onConnectedRef.current = onConnected;
  modeRef.current = mode;
  pingMsRef.current = locationPingMs;

  const sendLocation = useCallback((lat, lng) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    try {
      socket.send(
        JSON.stringify({
          type: 'location',
          latitude: lat,
          longitude: lng,
        })
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const numericId = Number(incidentId);
    if (!Number.isFinite(numericId) || numericId <= 0 || !enabled) return undefined;

    let cancelled = false;

    const clearPing = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const teardown = () => {
      cancelled = true;
      clearPing();
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };

    (async () => {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token || cancelled) {
        if (!token) wsDebug('sin access_token en SecureStore');
        return;
      }

      const url = buildIncidentTrackingWsUrl(numericId, token);
      wsDebug('conectando', url.replace(/token=[^&]+/, 'token=***'), 'modo=', modeRef.current);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data || '{}');
          if (data.type === 'connected') {
            wsDebug('mensaje connected', data);
            onConnectedRef.current?.();
            return;
          }
          if (data.type === 'technician_location' && onLocRef.current) {
            const lat = Number(data.latitude);
            const lng = Number(data.longitude);
            if (hasUsableGps(lat, lng)) {
              onLocRef.current({
                latitude: lat,
                longitude: lng,
                ts: data.ts,
              });
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = (e) => {
        wsDebug('error', e?.message || e);
      };

      ws.onclose = (e) => {
        wsDebug('cerrado code=', e?.code, 'reason=', e?.reason);
        const reason = String(e?.reason || '');
        if (reason.includes('404') || reason.includes('Not Found')) {
          wsDebug(
            'sugerencia: el backend debe usar ASGI (p. ej. python manage.py runasgi). runserver WSGI devuelve 404 en /ws/incident/…'
          );
        }
        if (e?.code === 4001) {
          wsDebug('sugerencia: token inválido o expirado');
        }
        if (e?.code === 4003) {
          wsDebug('sugerencia: sin permiso para este incidente (rol o asignación)');
        }
      };

      ws.onopen = async () => {
        if (cancelled) {
          try {
            ws.close();
          } catch {
            // ignore
          }
          return;
        }

        if (modeRef.current === 'broadcast') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted' || cancelled) {
            wsDebug('broadcast: permiso de ubicación denegado');
            return;
          }

          const pushOnce = async () => {
            if (cancelled || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
            try {
              const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              if (!hasUsableGps(lat, lng)) return;
              sendLocation(lat, lng);
              if (onLocRef.current) {
                onLocRef.current({
                  latitude: lat,
                  longitude: lng,
                  ts: new Date().toISOString(),
                });
              }
            } catch {
              // sin fix momentáneo
            }
          };

          await pushOnce();
          intervalRef.current = setInterval(pushOnce, pingMsRef.current);
        }
      };
    })();

    return teardown;
  }, [incidentId, enabled, mode, locationPingMs, sendLocation]);
}
