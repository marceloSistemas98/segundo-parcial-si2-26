import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

function escapeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

/**
 * Mapa embebido con Leaflet + teselas OpenStreetMap (sin API key).
 * Actualiza marcador del técnico vía injectJavaScript.
 */
export default function OpenStreetMapView({
  clientLat,
  clientLng,
  technicianLat,
  technicianLng,
  height = 220,
}) {
  const webRef = useRef(null);

  const cLat = escapeNum(clientLat);
  const cLng = escapeNum(clientLng);
  const tLat = technicianLat != null ? escapeNum(technicianLat) : null;
  const tLng = technicianLng != null ? escapeNum(technicianLng) : null;

  const html = useMemo(
    () => `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { box-sizing: border-box; }
  html, body, #map { margin:0; padding:0; height:100%; width:100%; }
</style>
</head><body>
<div id="map"></div>
<script>
(function(){
  var cLat = ${cLat}, cLng = ${cLng};
  var map = L.map('map', { zoomControl: true }).setView([cLat, cLng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  L.marker([cLat, cLng]).addTo(map).bindPopup('Ubicación del incidente');
  var techMarker = null;
  window.setTechnician = function(lat, lng) {
    if (techMarker) map.removeLayer(techMarker);
    techMarker = L.marker([lat, lng], { icon: L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    }) }).addTo(map).bindPopup('Técnico');
    map.fitBounds(L.latLngBounds([[cLat,cLng],[lat,lng]]), { padding: [36,36], maxZoom: 16 });
  };
  ${tLat != null && tLng != null ? `window.setTechnician(${tLat}, ${tLng});` : ''}
})();
</script>
</body></html>`,
    [cLat, cLng, tLat, tLng]
  );

  useEffect(() => {
    if (tLat == null || tLng == null || !webRef.current) return;
    const js = `window.setTechnician && window.setTechnician(${tLat}, ${tLng}); true;`;
    webRef.current.injectJavaScript(js);
  }, [tLat, tLng]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        setBuiltInZoomControls={false}
        onMessage={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  web: { flex: 1, backgroundColor: '#e5e7eb' },
});
