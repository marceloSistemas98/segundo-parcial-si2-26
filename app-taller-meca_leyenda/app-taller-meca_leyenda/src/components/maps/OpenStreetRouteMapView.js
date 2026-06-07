import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

function n(x) {
  const v = typeof x === 'string' ? parseFloat(x) : Number(x);
  return Number.isFinite(v) ? v : null;
}

/** Evita scripts injectJavaScript demasiado largos (Android) con rutas OSRM muy densas. */
function downsampleRoute(route, maxPoints = 320) {
  if (!route || route.length <= maxPoints) return route;
  const step = Math.ceil(route.length / maxPoints);
  const out = [];
  for (let i = 0; i < route.length; i += step) {
    out.push(route[i]);
  }
  const last = route[route.length - 1];
  const prev = out[out.length - 1];
  if (!prev || prev[0] !== last[0] || prev[1] !== last[1]) {
    out.push(last);
  }
  return out;
}

/**
 * Mapa OSM (Leaflet en WebView) con ruta + destino + origen (técnico).
 * Teselas: tile.openstreetmap.org (política actual OSM). invalidateSize para evitar mapa en gris en Android.
 */
export default function OpenStreetRouteMapView({
  destinationLat,
  destinationLng,
  originLat,
  originLng,
  /** @type {Array<[number, number]>|null} [lat, lng][] */
  routeCoordinates,
  height = 260,
  /** Título corto para el pin rojo (se añaden coordenadas en el popup). */
  destinationTitle = 'Destino',
  /** Título corto para el pin verde (se añaden coordenadas en el popup). */
  originTitle = 'Origen',
}) {
  const webRef = useRef(null);

  const dLat = n(destinationLat);
  const dLng = n(destinationLng);
  const oLat = n(originLat);
  const oLng = n(originLng);

  const destPopupJson = useMemo(() => {
    if (dLat == null || dLng == null) return '""';
    const line1 = String(destinationTitle || 'Destino').replace(/</g, '‹').replace(/>/g, '›');
    const line2 = `${dLat.toFixed(5)}, ${dLng.toFixed(5)}`;
    return JSON.stringify(`<b>${line1}</b><br><span style="font-size:12px">${line2}</span>`);
  }, [dLat, dLng, destinationTitle]);

  const html = useMemo(
    () => `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { box-sizing: border-box; }
  html, body, #map { margin:0; padding:0; height:100%; width:100%; }
  .leaflet-tile { max-width: none !important; }
</style>
</head><body>
<div id="map"></div>
<script>
(function(){
  var dLat = ${dLat}, dLng = ${dLng};
  var destPopupHtml = ${destPopupJson};
  if (typeof dLat !== 'number' || typeof dLng !== 'number' || isNaN(dLat) || isNaN(dLng)) {
    document.body.innerHTML = '<p style="padding:12px;font-family:sans-serif">Coordenadas inválidas</p>';
    return;
  }
  var map = L.map('map', { zoomControl: true }).setView([dLat, dLng], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 3,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var destIcon = L.divIcon({
    className: 'pin-dest',
    html: '<div style="width:16px;height:16px;background:#dc2626;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
  var techIcon = L.divIcon({
    className: 'pin-tech',
    html: '<div style="width:16px;height:16px;background:#059669;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  L.marker([dLat, dLng], { icon: destIcon }).addTo(map).bindPopup(destPopupHtml);

  var techMarker = null;
  var routeLayer = null;

  function fitAll() {
    var pts = [[dLat, dLng]];
    if (techMarker) pts.push(techMarker.getLatLng());
    if (routeLayer) {
      routeLayer.getLatLngs().forEach(function (ll) {
        pts.push([ll.lat, ll.lng]);
      });
    }
    if (pts.length === 1) {
      map.setView([dLat, dLng], 15);
    } else {
      map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16 });
    }
    setTimeout(function () { try { map.invalidateSize(true); } catch (e) {} }, 100);
    setTimeout(function () { try { map.invalidateSize(true); } catch (e) {} }, 500);
  }

  window.__mapApply = function(payload) {
    try {
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }
      if (payload.route && payload.route.length > 1) {
        routeLayer = L.polyline(payload.route, {
          color: '#059669',
          weight: 5,
          opacity: 0.88,
          lineJoin: 'round'
        }).addTo(map);
      }
      if (techMarker) {
        map.removeLayer(techMarker);
        techMarker = null;
      }
      if (payload.tech && payload.tech.length === 2) {
        var tla = Number(payload.tech[0]), tlo = Number(payload.tech[1]);
        if (isFinite(tla) && isFinite(tlo)) {
          var popt = payload.originPopup || 'Origen';
          techMarker = L.marker([tla, tlo], { icon: techIcon }).addTo(map).bindPopup(popt);
        }
      }
      fitAll();
    } catch (e) {}
  };

  window.__mapApply({ tech: null, route: null, originPopup: '' });
  setTimeout(fitAll, 200);
})();
</script>
</body></html>`,
    [dLat, dLng, destPopupJson]
  );

  const pushPayload = useCallback(() => {
    if (!webRef.current || dLat == null || dLng == null) return;
    const line1 = String(originTitle || 'Origen').replace(/</g, '‹').replace(/>/g, '›');
    const originPopup =
      oLat != null && oLng != null
        ? `<b>${line1}</b><br><span style="font-size:12px">${oLat.toFixed(5)}, ${oLng.toFixed(5)}</span>`
        : '';
    const routeRaw = routeCoordinates && routeCoordinates.length > 1 ? routeCoordinates : null;
    const payload = {
      route: downsampleRoute(routeRaw),
      tech: oLat != null && oLng != null ? [oLat, oLng] : null,
      originPopup,
    };
    const js = `window.__mapApply && window.__mapApply(${JSON.stringify(payload)}); true;`;
    webRef.current.injectJavaScript(js);
  }, [dLat, dLng, oLat, oLng, routeCoordinates, originTitle]);

  useEffect(() => {
    pushPayload();
  }, [pushPayload]);

  if (dLat == null || dLng == null) {
    return (
      <View style={[styles.wrap, styles.fallback, { height }]}>
        <Text style={styles.fallbackText}>Sin coordenadas válidas del incidente</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]} collapsable={false}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        setBuiltInZoomControls={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback
        nestedScrollEnabled
        {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' } : {})}
        onMessage={() => {}}
        onLoadEnd={pushPayload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  web: { flex: 1, backgroundColor: '#e5e7eb' },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  fallbackText: { color: '#64748b', fontSize: 13, paddingHorizontal: 16, textAlign: 'center' },
});
