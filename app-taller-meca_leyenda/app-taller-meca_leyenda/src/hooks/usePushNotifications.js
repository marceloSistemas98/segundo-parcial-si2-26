import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth.api';
import { useNotificationStore } from '../store/notification.store';
import { useAuthStore } from '../store/auth.store';

// Expo Go no incluye el cliente FCM nativo completo; hace falta dev build (expo run:android / EAS).
const isExpoGo = Constants.appOwnership === 'expo';

const EAS_PROJECT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** extra.eas.projectId del bundle (Metro no siempre rellena Constants.expoConfig en dev). */
let cachedAppJsonExtra = null;
function getExtraFromAppJson() {
  if (cachedAppJsonExtra !== null) return cachedAppJsonExtra;
  try {
    cachedAppJsonExtra = require('../../app.json')?.expo?.extra ?? null;
  } catch {
    cachedAppJsonExtra = {};
  }
  return cachedAppJsonExtra;
}

/**
 * UUID del proyecto en expo.dev (EAS). Si subiste FCM a EAS, Expo usa ese canal;
 * el cliente sigue registrando un ExponentPushToken, no el FCM raw.
 */
function resolveExpoProjectId() {
  const extra = getExtraFromAppJson();
  const candidates = [
    Constants.expoConfig?.extra?.eas?.projectId,
    Constants.expoConfig?.extra?.easProjectId,
    Constants.manifest?.extra?.eas?.projectId,
    Constants.manifest?.extra?.easProjectId,
    Constants.manifest2?.extra?.eas?.projectId,
    Constants.manifest2?.extra?.easProjectId,
    Constants.easConfig?.projectId,
    extra?.eas?.projectId,
    extra?.easProjectId,
  ];
  for (const id of candidates) {
    if (typeof id === 'string' && EAS_PROJECT_ID_RE.test(id.trim())) {
      return id.trim();
    }
  }
  return null;
}

// Solo configurar el handler si NO estamos en Expo Go
if (!isExpoGo) {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

function navigateFromPushData(data) {
  if (!data || typeof data !== 'object') return;
  const incidentId = data.incident_id ?? data.incidentId;
  const assignmentId = data.assignment_id ?? data.assignmentId;
  const type = String(data.type || '');

  // Calificaciones (`new_rating`) van al dueño del taller (panel web / FCM del owner), no a la app cliente.
  if (type === 'new_rating') return;

  if (type === 'technician_assignment' && assignmentId) {
    try {
      router.push(`/(technician)/assignment/${String(assignmentId)}`);
    } catch {
      /* ignore */
    }
    return;
  }

  if (type === 'technician_nearby' && incidentId) {
    try {
      router.push(`/requests/${incidentId}`);
    } catch {
      /* ignore */
    }
    return;
  }

  if (type === 'technician_in_route' && incidentId) {
    try {
      router.push(`/requests/${incidentId}`);
    } catch {
      /* ignore */
    }
    return;
  }

  if (incidentId) {
    if (
      type.includes('request') ||
      type.includes('status') ||
      type.includes('assigned') ||
      type.includes('workshop') ||
      type.includes('completed') ||
      type.includes('payment') ||
      type === ''
    ) {
      try {
        router.push(`/emergency/status/${incidentId}`);
      } catch {
        /* ignore */
      }
    }
  }
}

export function usePushNotifications() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  /** Listeners: viven toda la sesión de la app (no dependen del login). */
  useEffect(() => {
    if (isExpoGo) {
      console.warn(
        '⚠️ Push notifications no disponibles en Expo Go. Usa: npx expo run:android o un build EAS.'
      );
      return;
    }

    const Notifications = require('expo-notifications');

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      incrementUnread();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      navigateFromPushData(data);
    });

    return () => {
      notificationListener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, [incrementUnread]);

  /**
   * Registro en backend: solo con sesión válida (flujo HTML Fase 3).
   * Evita POST /auth/fcm-token/ sin JWT → 401 → interceptor sin refresh.
   */
  useEffect(() => {
    if (isExpoGo) return;
    if (isLoading) return;
    if (!isAuthenticated) return;

    const Notifications = require('expo-notifications');

    (async () => {
      if (!Device.isDevice) {
        console.warn('Push notifications solo funcionan en dispositivos físicos');
        return;
      }

      try {
        const access = await SecureStore.getItemAsync('access_token');
        if (!access) return;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Permisos de notificaciones denegados');
          return;
        }

        let token = null;

        const projectId = resolveExpoProjectId();
        if (projectId) {
          try {
            const expoRes = await Notifications.getExpoPushTokenAsync({ projectId });
            if (expoRes?.data && typeof expoRes.data === 'string') {
              token = expoRes.data;
            }
          } catch (e) {
            console.warn('getExpoPushTokenAsync:', e?.message ?? e);
          }
        } else {
          console.warn(
            'Push: no se encontró extra.eas.projectId. Añádelo en app.json (expo.extra.eas.projectId) con el UUID de https://expo.dev/accounts/…/project/…'
          );
        }

        if (!token) {
          try {
            const native = await Notifications.getDevicePushTokenAsync();
            if (native?.data && typeof native.data === 'string') {
              token = native.data;
            }
          } catch (e) {
            if (__DEV__) {
              console.warn(
                'FCM nativo no disponible (normal si falta API key en google-services.json o no hiciste prebuild). Usando solo Expo Push o revisa Firebase Console → descargar google-services.json de nuevo.'
              );
            }
          }
        }

        if (!token) {
          console.warn('No se obtuvo token de push');
          return;
        }

        await authApi.updateFcmToken(token);
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#ef4444',
          });
        }
      } catch (error) {
        const isNetwork =
          !error?.response &&
          (error?.message === 'Network Error' ||
            error?.code === 'ERR_NETWORK' ||
            error?.code === 'ECONNABORTED');
        if (isNetwork && __DEV__) {
          console.warn(
            'No se pudo registrar el token push (red). Comprueba EXPO_PUBLIC_API_URL / extra.apiUrl, que Django esté accesible desde el dispositivo y usesCleartextTraffic (Android) para http:// en LAN.'
          );
        } else if (!isNetwork) {
          console.error('Error registrando notificaciones push:', error);
        }
      }
    })();
  }, [isLoading, isAuthenticated]);

  return null;
}
