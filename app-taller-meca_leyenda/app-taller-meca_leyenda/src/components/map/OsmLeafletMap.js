import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

function latitudeDeltaToZoom(latitudeDelta) {
  if (!latitudeDelta || latitudeDelta <= 0) return 13;
  const z = Math.log2(360 / latitudeDelta) - 1;
  return Math.min(18, Math.max(4, Math.round(z)));
}

function escapeForInlineJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function workshopMarkerHtml() {
  return (
    '<div class="ws-pin">' +
    '<div class="ws-pin-body">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M14.7 6.3a1 1 0 0 0 0 3.4l1.6 1.6a1 1 0 0 0 3.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' +
    '</svg>' +
    '</div>' +
    '<div class="ws-pin-tail"></div>' +
    '</div>'
  );
}

function buildMapHtml(cfg) {
  const json = escapeForInlineJson(cfg);
  const wsIcon = workshopMarkerHtml();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #f0f7ff; }
    .leaflet-control-attribution { font-size: 9px; max-width: 55%; opacity: 0.85; }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      border: 1px solid rgba(37,99,235,0.15);
      box-shadow: 0 8px 24px rgba(37,99,235,0.15);
      padding: 0;
      overflow: hidden;
    }
    .leaflet-popup-content { margin: 10px 12px; font: 13px system-ui, sans-serif; color: #0f172a; }
    .leaflet-popup-tip { background: #fff; }
    .ws-popup-title { font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 4px; }
    .ws-popup-meta { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px; }
    .ws-popup-badge {
      display: inline-block; margin-top: 6px; padding: 3px 8px; border-radius: 999px;
      background: rgba(219,234,254,0.9); color: #1d4ed8; font-size: 11px; font-weight: 600;
    }
    .ws-m { background: transparent !important; border: none !important; }
    .ws-pin { position: relative; width: 42px; height: 50px; }
    .ws-pin-body {
      width: 38px; height: 38px; margin: 0 auto;
      background: linear-gradient(145deg, #2563eb 0%, #3b82f6 100%);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      border: 2.5px solid #fff;
      box-shadow: 0 4px 14px rgba(37,99,235,0.45);
    }
    .ws-pin-tail {
      position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 7px solid transparent; border-right: 7px solid transparent;
      border-top: 9px solid #2563eb;
      filter: drop-shadow(0 2px 2px rgba(37,99,235,0.25));
    }
    .user-pin-wrap { position: relative; width: 44px; height: 44px; }
    .user-pulse {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(37,99,235,0.22);
      animation: pulse 2s ease-out infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.65); opacity: 0.85; }
      70% { transform: scale(1.15); opacity: 0; }
      100% { transform: scale(1.15); opacity: 0; }
    }
    .user-dot {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 18px; height: 18px; border-radius: 50%;
      background: #2563eb; border: 3px solid #fff;
      box-shadow: 0 2px 10px rgba(37,99,235,0.5);
    }
    .user-m { background: transparent !important; border: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    (function () {
      var cfg = ${json};
      var wsIconHtml = ${JSON.stringify(wsIcon)};
      var map = L.map('map', { zoomControl: true }).setView([cfg.userLat, cfg.userLng], cfg.zoom);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      }).addTo(map);
      L.circle([cfg.userLat, cfg.userLng], {
        radius: cfg.radiusMeters,
        color: '#2563eb',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#3b82f6',
        fillOpacity: 0.07
      }).addTo(map);
      var userIcon = L.divIcon({
        className: 'user-m',
        html: '<div class="user-pin-wrap"><div class="user-pulse"></div><div class="user-dot"></div></div>',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
      L.marker([cfg.userLat, cfg.userLng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<div class="ws-popup-title">Tu ubicación</div><div class="ws-popup-meta">Centro de búsqueda de talleres</div>');
      (cfg.workshops || []).forEach(function (w) {
        var icon = L.divIcon({
          className: 'ws-m',
          html: wsIconHtml,
          iconSize: [42, 50],
          iconAnchor: [21, 48]
        });
        var marker = L.marker([w.lat, w.lng], { icon: icon }).addTo(map);
        var popup = '<div class="ws-popup-title">' + (w.name || 'Taller') + '</div>';
        if (w.distanceKm != null) {
          popup += '<div class="ws-popup-meta">&#128205; ' + Number(w.distanceKm).toFixed(1) + ' km de distancia</div>';
        }
        if (w.rating != null) {
          popup += '<div class="ws-popup-meta">&#9733; ' + Number(w.rating).toFixed(1) + ' calificación</div>';
        }
        popup += '<div class="ws-popup-badge">Toca para ver detalle</div>';
        marker.bindPopup(popup);
        marker.on('click', function () {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'workshop', id: w.id }));
          }
        });
      });
      if ((cfg.workshops || []).length > 0) {
        var points = [[cfg.userLat, cfg.userLng]];
        (cfg.workshops || []).forEach(function (w) { points.push([w.lat, w.lng]); });
        map.fitBounds(L.latLngBounds(points).pad(0.22), { maxZoom: cfg.zoom });
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Mapa con teselas OpenStreetMap (Leaflet en WebView). No usa Google Maps ni API key.
 */
export default function OsmLeafletMap({
  style,
  userLocation,
  latitudeDelta = 0.05,
  circleRadiusMeters = 20000,
  workshops = [],
  onWorkshopPress,
}) {
  const html = useMemo(() => {
    const zoom = latitudeDeltaToZoom(latitudeDelta);
    const cfg = {
      userLat: userLocation.latitude,
      userLng: userLocation.longitude,
      zoom,
      radiusMeters: circleRadiusMeters,
      workshops: workshops.map((w) => ({
        id: w.id,
        lat: Number(w.latitude),
        lng: Number(w.longitude),
        name: w.name,
        distanceKm: w.distance_km ?? w.distance ?? null,
        rating: w.rating_avg ?? null,
      })),
    };
    return buildMapHtml(cfg);
  }, [
    userLocation.latitude,
    userLocation.longitude,
    latitudeDelta,
    circleRadiusMeters,
    workshops,
  ]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'workshop' && onWorkshopPress) {
              onWorkshopPress(msg.id);
            }
          } catch {
            /* ignore */
          }
        }}
        userAgent="EmergenciasVehiculares/1.0 (mapa OSM; +https://openstreetmap.org/copyright)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#f0f7ff' },
});
