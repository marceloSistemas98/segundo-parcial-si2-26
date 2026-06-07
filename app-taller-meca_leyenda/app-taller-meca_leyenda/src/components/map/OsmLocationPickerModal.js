import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function escapeForInlineJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function buildPickerHtml(lat, lng, zoom) {
  const json = escapeForInlineJson({ lat, lng, zoom });
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-control-attribution { font-size: 9px; max-width: 55%; }
    .hint {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 1000;
      background: rgba(15,23,42,0.85); color: #fff; padding: 8px 14px; border-radius: 20px;
      font: 13px system-ui, sans-serif; pointer-events: none; white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="hint">Toca el mapa o arrastra el pin</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    (function () {
      var cfg = ${json};
      var map = L.map('map', { zoomControl: true }).setView([cfg.lat, cfg.lng], cfg.zoom);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      }).addTo(map);
      var pinHtml = '<div style="width:32px;height:32px;display:flex;align-items:flex-start;justify-content:center;">'
        + '<span style="display:block;width:24px;height:24px;background:#dc2626;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);margin-top:4px;"></span></div>';
      var icon = L.divIcon({ className: 'pick-pin', html: pinHtml, iconSize: [32, 40], iconAnchor: [16, 36] });
      var marker = L.marker([cfg.lat, cfg.lng], { draggable: true, icon: icon }).addTo(map);
      function emit() {
        var ll = marker.getLatLng();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pick', lat: ll.lat, lng: ll.lng }));
        }
      }
      marker.on('dragend', emit);
      map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        emit();
      });
      setTimeout(emit, 100);
    })();
  </script>
</body>
</html>`;
}

/**
 * Modal para elegir un punto en el mapa (OpenStreetMap + Leaflet en WebView).
 */
export default function OsmLocationPickerModal({
  visible,
  onClose,
  onConfirm,
  initialLatitude,
  initialLongitude,
  zoom = 16,
}) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const mapHeight = Math.min(winH * 0.62, 420);

  const [draft, setDraft] = useState(null);
  const [mapNonce, setMapNonce] = useState(0);

  const lat = initialLatitude ?? -16.5;
  const lng = initialLongitude ?? -68.15;

  useEffect(() => {
    if (!visible) return;
    setMapNonce((n) => n + 1);
    if (initialLatitude != null && initialLongitude != null) {
      setDraft({ latitude: initialLatitude, longitude: initialLongitude });
    }
  }, [visible, initialLatitude, initialLongitude]);

  const html = useMemo(() => buildPickerHtml(lat, lng, zoom), [lat, lng, zoom]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              maxHeight: winH * 0.92,
            },
          ]}
        >
          <View className="px-4 pt-3 pb-2 border-b border-slate-200">
            <Text className="text-slate-900 font-bold text-lg">Ubicación en el mapa</Text>
            <Text className="text-slate-600 text-sm mt-1">
              OpenStreetMap — toca donde estés o arrastra el pin
            </Text>
          </View>

          <View style={[styles.mapWrap, { height: mapHeight }]}>
            <WebView
              key={`osm-picker-${mapNonce}`}
              style={styles.webview}
              originWhitelist={['*']}
              source={{ html }}
              javaScriptEnabled
              domStorageEnabled
              onMessage={(e) => {
                try {
                  const msg = JSON.parse(e.nativeEvent.data);
                  if (msg.type === 'pick' && msg.lat != null && msg.lng != null) {
                    setDraft({ latitude: msg.lat, longitude: msg.lng });
                  }
                } catch {
                  /* ignore */
                }
              }}
              userAgent="EmergenciasVehiculares/1.0 (OSM picker; +https://openstreetmap.org/copyright)"
            />
          </View>

          {draft && (
            <Text className="text-slate-600 text-xs px-4 py-2 text-center">
              {draft.latitude.toFixed(6)}, {draft.longitude.toFixed(6)}
            </Text>
          )}

          <View className="flex-row gap-3 px-4 pt-2">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-200 items-center active:opacity-80"
            >
              <Text className="text-slate-800 font-semibold">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (draft) {
                  onConfirm(draft);
                  onClose();
                }
              }}
              disabled={!draft}
              className={`flex-1 py-3 rounded-xl items-center ${draft ? 'bg-red-600 active:opacity-90' : 'bg-slate-300'}`}
            >
              <Text className="text-white font-semibold">Usar esta ubicación</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  mapWrap: {
    width: '100%',
    backgroundColor: '#e8eef3',
  },
  webview: {
    flex: 1,
  },
});
