# 📱 App Móvil Cliente – Especificación Técnica React Native + Expo
## Plataforma Inteligente de Atención de Emergencias Vehiculares

---

## 1. STACK Y VERSIONES

| Tecnología | Versión | Rol |
|---|---|---|
| React Native | 0.74+ | Framework base |
| Expo SDK | 51+ | Toolchain y APIs nativas |
| Expo Router | 3.x | Navegación basada en archivos (file-based) |
| TypeScript | 5.4+ | Lenguaje tipado |
| Zustand | 4.x | Estado global (ligero, sin boilerplate) |
| TanStack Query | 5.x | Fetching, caché y sincronización de datos |
| Axios | 1.x | Cliente HTTP base |
| Expo Location | 17.x | GPS y geolocalización |
| Expo Camera | 15.x | Captura de fotos del vehículo |
| Expo AV | 14.x | Grabación y reproducción de audio |
| Expo Notifications | 0.28.x | Push notifications Firebase via Expo |
| react-native-maps | 1.14.x | Mapa radar de talleres (MapView) |
| @stripe/stripe-react-native | 0.37.x | Pago desde la app |
| Expo SecureStore | 13.x | Almacenamiento seguro de tokens JWT |
| Expo Image Picker | 15.x | Selección de fotos de galería |
| React Native Reanimated | 3.x | Animaciones fluidas |
| React Native Gesture Handler | 2.x | Gestos nativos |
| NativeWind | 4.x | Tailwind CSS para React Native |
| react-native-safe-area-context | 4.x | SafeArea en notch/dynamic island |
| @expo/vector-icons | 14.x | Íconos (Ionicons, MaterialIcons) |
| dayjs | 1.x | Manejo de fechas |
| react-native-toast-message | 2.x | Notificaciones toast |

---

## 2. ESTRUCTURA DEL PROYECTO

```
emergencias-app/
├── app/                            # Expo Router (file-based routing)
│   ├── _layout.tsx                 # Root layout (providers, fonts, splash)
│   ├── index.tsx                   # Redirección raíz → /auth o /home
│   │
│   ├── (auth)/                     # Grupo: pantallas públicas
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (app)/                      # Grupo: pantallas protegidas (cliente autenticado)
│   │   ├── _layout.tsx             # Tab navigator principal
│   │   │
│   │   ├── home/
│   │   │   └── index.tsx           # 🗺️ RADAR: mapa + botones principales
│   │   │
│   │   ├── emergency/
│   │   │   ├── index.tsx           # Selección de vehículo + tipo de emergencia
│   │   │   ├── evidence.tsx        # Captura foto / audio / texto
│   │   │   └── status/
│   │   │       └── [id].tsx        # Estado en tiempo real del incidente
│   │   │
│   │   ├── requests/
│   │   │   ├── index.tsx           # Historial de incidentes
│   │   │   └── [id].tsx            # Detalle de incidente
│   │   │
│   │   ├── vehicles/
│   │   │   ├── index.tsx           # Lista de vehículos registrados
│   │   │   ├── add.tsx             # Agregar vehículo
│   │   │   └── [id].tsx            # Editar vehículo
│   │   │
│   │   ├── notifications/
│   │   │   └── index.tsx           # Centro de notificaciones
│   │   │
│   │   └── profile/
│   │       └── index.tsx           # Perfil y configuración del cliente
│   │
│   └── payment/
│       └── [assignmentId].tsx      # Flujo de pago Stripe (modal)
│
├── src/
│   ├── api/                        # Capa de acceso al backend
│   │   ├── client.ts               # Axios instance con interceptores
│   │   ├── auth.api.ts
│   │   ├── incidents.api.ts
│   │   ├── workshops.api.ts
│   │   ├── vehicles.api.ts
│   │   ├── payments.api.ts
│   │   └── notifications.api.ts
│   │
│   ├── store/                      # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── incident.store.ts
│   │   └── notification.store.ts
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useLocation.ts
│   │   ├── useNearbyWorkshops.ts
│   │   ├── useSSE.ts               # Server-Sent Events
│   │   ├── usePushNotifications.ts
│   │   ├── useCamera.ts
│   │   └── useAudioRecorder.ts
│   │
│   ├── components/                 # Componentes reutilizables
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx           # Estado / prioridad
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── BottomSheet.tsx
│   │   ├── map/
│   │   │   ├── RadarMap.tsx        # Mapa con talleres cercanos
│   │   │   ├── WorkshopMarker.tsx
│   │   │   └── IncidentMarker.tsx
│   │   ├── incident/
│   │   │   ├── IncidentCard.tsx
│   │   │   ├── StatusTimeline.tsx
│   │   │   ├── AISummaryCard.tsx
│   │   │   └── EvidencePreview.tsx
│   │   └── workshop/
│   │       ├── WorkshopCard.tsx
│   │       └── WorkshopDetail.tsx
│   │
│   ├── models/                     # Interfaces TypeScript
│   │   ├── user.model.ts
│   │   ├── incident.model.ts
│   │   ├── workshop.model.ts
│   │   ├── vehicle.model.ts
│   │   └── payment.model.ts
│   │
│   ├── utils/
│   │   ├── format.ts               # Formateo de fechas, monedas, distancias
│   │   ├── permissions.ts          # Solicitud de permisos nativos
│   │   └── sse.ts                  # EventSource helper para RN
│   │
│   └── constants/
│       ├── colors.ts
│       ├── api.ts                  # Base URL y prefijos
│       └── config.ts
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── app.json
├── babel.config.js
├── tailwind.config.js
└── package.json
```

---

## 3. MODELOS TYPESCRIPT

```typescript
// src/models/user.model.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'client';
  avatar: string | null;
  is_verified: boolean;
}

export interface ClientProfile {
  id: number;
  user: number;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  stripe_customer_id: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  fcm_token: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}
```

```typescript
// src/models/vehicle.model.ts

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'van' | 'bus';

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  vehicle_type: VehicleType;
  vin: string;
  photo: string | null;
  is_active: boolean;
}

export interface CreateVehiclePayload {
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  vehicle_type: VehicleType;
  vin?: string;
}
```

```typescript
// src/models/incident.model.ts

export type IncidentStatus =
  | 'pending' | 'analyzing' | 'waiting_workshop'
  | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export type IncidentType =
  | 'battery' | 'tire' | 'accident' | 'engine'
  | 'locksmith' | 'overheating' | 'other' | 'uncertain';

export type EvidenceType = 'image' | 'audio' | 'text';

export interface Evidence {
  id: number;
  evidence_type: EvidenceType;
  file: string;              // URL del servidor
  transcription: string;
  label: string;
  created_at: string;
}

export interface AISummary {
  tipo_incidente: string;
  prioridad: string;
  resumen_breve: string;
  servicios_requeridos: string[];
  notas_tecnicas: string;
  requiere_grua: boolean;
}

export interface AssignmentInfo {
  id: number;
  workshop: {
    id: number;
    name: string;
    phone: string;
    logo: string | null;
    rating_avg: number;
  };
  technician: {
    id: number;
    name: string;
    phone: string;
    photo: string | null;
  } | null;
  status: string;
  distance_km: number;
  estimated_arrival_minutes: number | null;
  service_cost: number | null;
}

export interface Incident {
  id: number;
  status: IncidentStatus;
  priority: IncidentPriority | null;
  incident_type: IncidentType;
  description: string;
  latitude: number;
  longitude: number;
  address_text: string;
  ai_transcription: string;
  ai_summary: string;         // JSON string → parsear
  ai_confidence: number | null;
  vehicle: Vehicle;
  evidences: Evidence[];
  assignment?: AssignmentInfo;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentPayload {
  vehicle_id: number;
  latitude: number;
  longitude: number;
  address_text?: string;
  description?: string;
}
```

```typescript
// src/models/workshop.model.ts

export interface Workshop {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  logo: string | null;
  services: string[];
  rating_avg: number;
  total_services: number;
  distance_km: number;      // Calculado por el backend
}
```

---

## 4. CLIENTE HTTP (AXIOS)

```typescript
// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: inyecta JWT
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: renueva token si 401
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('refresh_token');
        const { data } = await axios.post(`${API_BASE_URL}/api/app/auth/refresh/`, { refresh });
        await SecureStore.setItemAsync('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      } catch {
        // Token expirado → limpiar sesión
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        // El AuthStore detectará que no hay token y redirigirá
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
```

```typescript
// src/constants/api.ts
export const API_BASE_URL = __DEV__
  ? 'http://192.168.x.x:8000'   // IP local en desarrollo
  : 'https://api.tudominio.com';

// Prefijos de endpoints para la app móvil (cliente)
export const APP = '/api/app';
```

---

## 5. SERVICIOS API

### 5.1 Auth

```typescript
// src/api/auth.api.ts
import client from './client';
import { APP } from '../constants/api';
import { AuthResponse, RegisterPayload } from '../models/user.model';

export const authApi = {
  register: (payload: RegisterPayload) =>
    client.post<AuthResponse>(`${APP}/auth/register/`, payload),

  login: (email: string, password: string) =>
    client.post<AuthResponse>(`${APP}/auth/login/`, { email, password }),

  logout: (refresh: string) =>
    client.post(`${APP}/auth/logout/`, { refresh }),

  refreshToken: (refresh: string) =>
    client.post<{ access: string }>(`${APP}/auth/refresh/`, { refresh }),

  getProfile: () =>
    client.get(`${APP}/auth/profile/`),

  updateProfile: (data: Partial<RegisterPayload>) =>
    client.patch(`${APP}/auth/profile/`, data),

  updateFcmToken: (fcm_token: string) =>
    client.post(`${APP}/auth/fcm-token/`, { fcm_token }),
};
```

### 5.2 Incidentes

```typescript
// src/api/incidents.api.ts
import client from './client';
import { APP } from '../constants/api';
import { CreateIncidentPayload, Incident } from '../models/incident.model';

export const incidentsApi = {
  create: (payload: CreateIncidentPayload) =>
    client.post<Incident>(`${APP}/incidents/`, payload),

  getAll: (params?: { status?: string }) =>
    client.get<{ results: Incident[] }>(`${APP}/incidents/`, { params }),

  getById: (id: number) =>
    client.get<Incident>(`${APP}/incidents/${id}/`),

  getAssignment: (id: number) =>
    client.get(`${APP}/incidents/${id}/assignment/`),

  cancel: (id: number) =>
    client.post(`${APP}/incidents/${id}/cancel/`),

  getStatusHistory: (id: number) =>
    client.get(`${APP}/incidents/${id}/status-history/`),

  /**
   * Sube una evidencia al incidente.
   * Usa FormData — no JSON — porque incluye archivos binarios.
   */
  uploadEvidence: (incidentId: number, formData: FormData) =>
    client.post(
      `${APP}/incidents/${incidentId}/evidence/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),
};
```

### 5.3 Talleres

```typescript
// src/api/workshops.api.ts
import client from './client';
import { APP } from '../constants/api';

export const workshopsApi = {
  getNearby: (lat: number, lng: number, radius = 20) =>
    client.get(`${APP}/workshops/nearby/`, {
      params: { lat, lng, radius },
    }),

  getById: (id: number) =>
    client.get(`${APP}/workshops/${id}/`),

  rate: (id: number, score: number, comment?: string) =>
    client.post(`${APP}/workshops/${id}/rate/`, { score, comment }),
};
```

### 5.4 Vehículos

```typescript
// src/api/vehicles.api.ts
import client from './client';
import { APP } from '../constants/api';
import { CreateVehiclePayload } from '../models/vehicle.model';

export const vehiclesApi = {
  getAll: () => client.get(`${APP}/vehicles/`),
  create: (payload: CreateVehiclePayload) => client.post(`${APP}/vehicles/`, payload),
  getById: (id: number) => client.get(`${APP}/vehicles/${id}/`),
  update: (id: number, payload: Partial<CreateVehiclePayload>) =>
    client.patch(`${APP}/vehicles/${id}/`, payload),
  delete: (id: number) => client.delete(`${APP}/vehicles/${id}/`),
};
```

### 5.5 Pagos

```typescript
// src/api/payments.api.ts
import client from './client';
import { APP } from '../constants/api';

export const paymentsApi = {
  createIntent: (assignment_id: number) =>
    client.post<{ client_secret: string; payment_intent_id: string }>(
      `${APP}/payments/create-intent/`, { assignment_id }
    ),

  confirm: (payment_intent_id: string) =>
    client.post(`${APP}/payments/confirm/`, { payment_intent_id }),

  getHistory: () =>
    client.get(`${APP}/payments/history/`),
};
```

---

## 6. ESTADO GLOBAL (ZUSTAND)

```typescript
// src/store/auth.store.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../models/user.model';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    await SecureStore.setItemAsync('access_token', data.tokens.access);
    await SecureStore.setItemAsync('refresh_token', data.tokens.refresh);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (refresh) await authApi.logout(refresh).catch(() => {});
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await authApi.getProfile();
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
```

```typescript
// src/store/incident.store.ts
import { create } from 'zustand';
import { Incident } from '../models/incident.model';

interface IncidentStore {
  // Incidente en proceso de creación (wizard)
  draftVehicleId: number | null;
  draftLatitude: number | null;
  draftLongitude: number | null;
  draftDescription: string;

  // Incidente activo (seguimiento en tiempo real)
  activeIncident: Incident | null;

  setDraft: (data: Partial<IncidentStore>) => void;
  setActiveIncident: (incident: Incident | null) => void;
  clearDraft: () => void;
}

export const useIncidentStore = create<IncidentStore>((set) => ({
  draftVehicleId: null,
  draftLatitude: null,
  draftLongitude: null,
  draftDescription: '',
  activeIncident: null,

  setDraft: (data) => set((state) => ({ ...state, ...data })),
  setActiveIncident: (incident) => set({ activeIncident: incident }),
  clearDraft: () => set({
    draftVehicleId: null,
    draftLatitude: null,
    draftLongitude: null,
    draftDescription: '',
  }),
}));
```

---

## 7. HOOKS CUSTOM

### 7.1 Geolocalización

```typescript
// src/hooks/useLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLoading(false);
    })();
  }, []);

  return { location, error, loading };
}
```

---

### 7.2 SSE (Server-Sent Events)

```typescript
// src/hooks/useSSE.ts
/**
 * React Native no tiene EventSource nativo.
 * Usamos fetch con ReadableStream para simular SSE.
 * Compatible con Expo / Hermes engine.
 */
import { useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

interface SSEOptions {
  onMessage: (data: any) => void;
  onError?: (error: any) => void;
}

export function useSSE(channel: string, options: SSEOptions) {
  const abortRef = useRef<AbortController | null>(null);
  const { onMessage, onError } = options;

  const connect = useCallback(async () => {
    const token = await SecureStore.getItemAsync('access_token');
    abortRef.current = new AbortController();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/app/notifications/stream/?channel=${channel}&token=${token}`,
        {
          signal: abortRef.current.signal,
          headers: { Accept: 'text/event-stream' },
        }
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              onMessage(parsed);
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        onError?.(err);
        // Reconexión automática con backoff
        setTimeout(() => connect(), 5000);
      }
    }
  }, [channel, onMessage, onError]);

  useEffect(() => {
    connect();
    return () => abortRef.current?.abort();
  }, [connect]);
}
```

---

### 7.3 Grabación de Audio

```typescript
// src/hooks/useAudioRecorder.ts
import { useState, useRef } from 'react';
import { Audio } from 'expo-av';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = recording;
    setIsRecording(true);
    setDuration(0);

    // Timer de duración
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recordingRef.current) return null;
    clearInterval(timerRef.current!);

    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    recordingRef.current = null;
    setIsRecording(false);
    setAudioUri(uri ?? null);
    return uri ?? null;
  };

  const clearAudio = () => setAudioUri(null);

  return { isRecording, audioUri, duration, startRecording, stopRecording, clearAudio };
}
```

---

### 7.4 Push Notifications

```typescript
// src/hooks/usePushNotifications.ts
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { authApi } from '../api/auth.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    // Expo genera el token compatible con FCM automáticamente
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'TU_EXPO_PROJECT_ID',   // En app.json > extra > eas.projectId
    })).data;

    // Enviar al backend para push notifications
    await authApi.updateFcmToken(token);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };
}
```

---

## 8. PANTALLAS — ESPECIFICACIÓN DETALLADA

### 8.1 Splash / Root (`app/index.tsx`)

```typescript
// Lógica de redirección inicial
// 1. Muestra SplashScreen (logo + animación)
// 2. Llama a authStore.restoreSession()
// 3. Si hay sesión → redirige a /(app)/home
// 4. Si no → redirige a /(auth)/login
```

---

### 8.2 Login (`app/(auth)/login.tsx`)

**UI:**
- Logo de la plataforma
- Campo email (keyboard: email)
- Campo contraseña (secureTextEntry)
- Botón [Iniciar sesión]
- Link "¿No tienes cuenta? Regístrate"
- Link "¿Olvidaste tu contraseña?"

**Lógica:**
- `useAuthStore().login(email, password)`
- Validación: campos no vacíos, email válido
- En error: toast "Credenciales incorrectas"
- En éxito: navega a `/(app)/home`

---

### 8.3 Registro (`app/(auth)/register.tsx`)

**UI — Formulario multi-step (2 pasos):**

Paso 1 — Datos personales:
- Nombre, Apellido, Teléfono
- Email, Contraseña, Confirmar contraseña

Paso 2 — Vehículo inicial (opcional, puede saltarse):
- Marca, Modelo, Año, Placa, Color
- Tipo de vehículo (selector)

**Lógica:**
- Al registrar obtiene el FCM token con `usePushNotifications`
- POST a `/api/app/auth/register/` con el token incluido
- Si el usuario salta el paso 2, puede agregar vehículos después desde `/vehicles/add`

---

### 8.4 🗺️ RADAR — Home (`app/(app)/home/index.tsx`)

**Esta es la pantalla más importante de la app.**

```
┌─────────────────────────────────────┐
│ 🔔   Emergencias Veh.        👤    │  Header
├─────────────────────────────────────┤
│                                     │
│   🗺️  MapView (70% de pantalla)     │
│                                     │
│   [📍 Marcador azul = usuario]      │
│   [🔧 Marcadores rojos = talleres]  │
│                                     │
│   Al tocar taller → BottomSheet:    │
│   nombre, distancia, rating,        │
│   servicios, botón [Ver detalle]    │
│                                     │
├─────────────────────────────────────┤
│  📊 3 talleres encontrados a 20km   │  Info strip
├─────────────────────────────────────┤
│                                     │
│  [ 🚨 REPORTAR EMERGENCIA ]         │  Botón primario rojo
│  [ 🔍 BUSCAR TALLER CERCANO ]       │  Botón secundario
│                                     │
└─────────────────────────────────────┘
```

**Lógica:**
```typescript
// 1. Obtener ubicación del usuario con useLocation()
// 2. Consultar GET /api/app/workshops/nearby/?lat=X&lng=Y&radius=20
// 3. Renderizar MapView centrado en usuario
// 4. Mostrar WorkshopMarker por cada taller
// 5. Subscripción SSE al canal del usuario para recibir actualizaciones en tiempo real
// 6. Si hay incidente activo → mostrar banner "Tienes un incidente en curso" → link a /emergency/status/{id}
```

```typescript
// RadarMap.tsx — componente clave
import MapView, { Marker, Circle } from 'react-native-maps';

<MapView
  style={{ flex: 1 }}
  region={{
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
  showsUserLocation
  showsMyLocationButton
>
  {/* Radio de búsqueda visual */}
  <Circle
    center={userLocation}
    radius={20000}  // 20 km en metros
    strokeColor="rgba(59,130,246,0.4)"
    fillColor="rgba(59,130,246,0.08)"
  />

  {/* Marcadores de talleres */}
  {workshops.map(ws => (
    <WorkshopMarker
      key={ws.id}
      workshop={ws}
      onPress={() => openWorkshopSheet(ws)}
    />
  ))}
</MapView>
```

---

### 8.5 Wizard de Emergencia

#### Paso 1 — Inicio (`app/(app)/emergency/index.tsx`)

```
┌─────────────────────────────────────┐
│ ← Reportar Emergencia               │
├─────────────────────────────────────┤
│  📍 Tu ubicación actual:            │
│  Av. Banzer y 4to Anillo           │  (geocoding reverso)
│  [Mapa pequeño con pin]             │
│                                     │
│  Selecciona tu vehículo:            │
│  ┌────────────────────────────┐     │
│  │ 🚗 Toyota Corolla 2020    │▼    │  Picker
│  └────────────────────────────┘     │
│  [+ Agregar vehículo]               │
│                                     │
│  Descripción (opcional):            │
│  ┌────────────────────────────┐     │
│  │ Describe brevemente...     │     │  TextArea
│  └────────────────────────────┘     │
│                                     │
│  [ SIGUIENTE → ]                    │
└─────────────────────────────────────┘
```

**Lógica:**
- `useLocation()` para obtener lat/lng actual
- Geocoding reverso: `Location.reverseGeocodeAsync()`
- Al tocar [SIGUIENTE]: crea el incidente en el backend (`POST /api/app/incidents/`)
- Guarda el `incident_id` en `useIncidentStore`
- Navega a `/emergency/evidence`

---

#### Paso 2 — Evidencias (`app/(app)/emergency/evidence.tsx`)

```
┌─────────────────────────────────────┐
│ ← Agregar Evidencias                │
│  Incidente #42 • Procesando...      │
├─────────────────────────────────────┤
│                                     │
│  📷 FOTOS DEL VEHÍCULO              │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ foto1│ │ foto2│ │  +   │        │  Grid de fotos
│  └──────┘ └──────┘ └──────┘        │
│  [📷 Tomar foto] [🖼️ Galería]       │
│                                     │
│  🎤 AUDIO (describe el problema)    │
│  ┌────────────────────────────┐     │
│  │  ●  00:08  [■ DETENER]    │     │  Grabando...
│  └────────────────────────────┘     │
│  [🎤 Grabar audio]                  │
│                                     │
│  📝 TEXTO ADICIONAL (opcional)      │
│  ┌────────────────────────────┐     │
│  │ El motor hace un ruido...  │     │
│  └────────────────────────────┘     │
│                                     │
│  [ 🚨 ENVIAR EMERGENCIA ]           │  Botón rojo grande
└─────────────────────────────────────┘
```

**Lógica:**
```typescript
// Fotos: Expo Camera / ImagePicker
// - Al tomar foto → POST /api/app/incidents/{id}/evidence/
//   FormData: { evidence_type: 'image', file: foto.jpg }

// Audio: Expo AV
// - Al detener grabación → POST /api/app/incidents/{id}/evidence/
//   FormData: { evidence_type: 'audio', file: audio.m4a }

// Texto: si hay texto → POST /api/app/incidents/{id}/evidence/
//   body JSON: { evidence_type: 'text', content: texto }

// Al tocar [ENVIAR]:
// 1. Sube todas las evidencias pendientes
// 2. Navega a /emergency/status/{incident_id}
// 3. El backend procesa el pipeline IA en background
```

---

#### Paso 3 — Seguimiento en Tiempo Real (`app/(app)/emergency/status/[id].tsx`)

```
┌─────────────────────────────────────┐
│ ← Seguimiento de Emergencia #42     │
├─────────────────────────────────────┤
│                                     │
│   ┌─────── IA ANALIZANDO ──────┐    │  Badge animado (mientras analyzing)
│   │  🤖 Procesando evidencias  │    │
│   │  ████████░░  80%           │    │
│   └─────────────────────────────┘   │
│                                     │
│   Tipo detectado: 🔋 Batería        │  Aparece tras IA
│   Prioridad: 🟡 Media              │
│   "Problema eléctrico identificado" │
│                                     │
│   🗺️ Mapa con ubicación del         │
│      incidente                      │
│                                     │
│   Timeline de estados:              │
│   ✅ Incidente creado  • 10:32      │
│   ✅ IA procesó        • 10:33      │
│   ⏳ Buscando taller...             │
│   ○  Taller asignado                │
│   ○  Técnico en camino              │
│   ○  Completado                     │
│                                     │
│  ─────────────────────────────────  │
│  TALLER ASIGNADO (aparece tras      │
│  asignación):                       │
│  🔧 Taller ABC                      │
│  ⭐ 4.8 • 2.1 km                   │
│  👷 Juan Pérez                      │
│  ⏱️ Llega en ~15 min               │
│  📞 [Llamar al taller]              │
│                                     │
│  [ ❌ Cancelar incidente ]           │  Solo si no está in_progress
└─────────────────────────────────────┘
```

**Lógica — SSE en tiempo real:**
```typescript
const { id } = useLocalSearchParams<{ id: string }>();
const { setActiveIncident } = useIncidentStore();

// TanStack Query para carga inicial
const { data: incident } = useQuery({
  queryKey: ['incident', id],
  queryFn: () => incidentsApi.getById(Number(id)).then(r => r.data),
  refetchInterval: false,  // Solo SSE después de carga inicial
});

// SSE para actualizaciones en tiempo real
useSSE(`incident-${id}`, {
  onMessage: (event) => {
    queryClient.invalidateQueries({ queryKey: ['incident', id] });
    // Mostrar toast según evento
    if (event.event === 'assigned') {
      showToast('¡Taller asignado! Está en camino 🚗');
    }
    if (event.event === 'ai_complete') {
      showToast('Análisis IA completado ✅');
    }
  },
});
```

---

### 8.6 Historial de Incidentes (`app/(app)/requests/index.tsx`)

```
┌─────────────────────────────────────┐
│  Mis Solicitudes                    │
├─────────────────────────────────────┤
│  [Activos] [Completados] [Cancelados│  Tabs
├─────────────────────────────────────┤
│  ┌────────────────────────────────┐ │
│  │ 🔋 Batería • 🟡 Media         │ │
│  │ Hace 2 horas                  │ │
│  │ Toyota Corolla 2020           │ │
│  │ Estado: En atención           │ │
│  │                [Ver detalle →] │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 🔧 Llanta • ✅ Completado     │ │
│  │ Hace 3 días                   │ │
│  │ [Calificar taller ⭐]          │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 8.7 Detalle de Incidente (`app/(app)/requests/[id].tsx`)

- Estado actual con badge de color
- Resumen IA (si disponible): tipo, prioridad, descripción, servicios requeridos, ¿requiere grúa?
- Transcripción del audio (texto Whisper)
- Galería de fotos subidas (scrollable horizontal)
- Información del taller y técnico asignado
- Timeline de estados con timestamps
- Si completado + sin pago → banner rojo [Pagar ahora]
- Si completado + con pago → calificación del taller (1–5 estrellas + comentario)

---

### 8.8 Vehículos (`app/(app)/vehicles/`)

**Lista:**
- Cada vehículo: foto (o ícono default), marca + modelo, placa, año
- Swipe-to-delete con confirmación
- Botón [+ Agregar vehículo]

**Agregar/Editar:**
- Formulario con: marca, modelo, año (picker numérico), placa, color, tipo, VIN
- Foto del vehículo (Expo ImagePicker o cámara)
- Validación de placa única

---

### 8.9 Pago con Stripe (`app/payment/[assignmentId].tsx`)

```
┌─────────────────────────────────────┐
│  Pagar Servicio                     │
├─────────────────────────────────────┤
│                                     │
│  Taller ABC                         │
│  Servicio: Asistencia eléctrica     │
│                                     │
│  Resumen:                           │
│  ──────────────────────────────     │
│  Total servicio:       $150.00      │
│  ──────────────────────────────     │
│  Total a pagar:        $150.00      │
│                                     │
│  ┌────────────────────────────┐     │
│  │  💳 Ingresa tu tarjeta     │     │  CardField de Stripe SDK
│  │  4242 4242 4242 4242       │     │
│  │  12/27   123               │     │
│  └────────────────────────────┘     │
│                                     │
│  [ 💳 PAGAR $150.00 ]               │  Botón primario
│  [ Cancelar ]                       │
│                                     │
│  🔒 Pago seguro con Stripe          │
└─────────────────────────────────────┘
```

**Lógica:**
```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { confirmPayment } = useStripe();

const handlePay = async () => {
  // 1. Crear PaymentIntent en el backend
  const { data } = await paymentsApi.createIntent(assignmentId);

  // 2. Confirmar con el SDK de Stripe (muestra UI de tarjeta)
  const { error, paymentIntent } = await confirmPayment(data.client_secret, {
    paymentMethodType: 'Card',
  });

  if (error) {
    showToast(`Error: ${error.message}`);
    return;
  }

  // 3. Notificar al backend que el pago se confirmó
  await paymentsApi.confirm(paymentIntent.id);
  showToast('✅ Pago exitoso');
  router.back();
};
```

---

### 8.10 Perfil (`app/(app)/profile/index.tsx`)

- Avatar + nombre del usuario
- Editar: nombre, apellido, teléfono
- Cambiar contraseña
- Sección: contacto de emergencia
- Cerrar sesión (con confirmación)
- Versión de la app

---

### 8.11 Notificaciones (`app/(app)/notifications/index.tsx`)

- Lista de notificaciones ordenadas por fecha
- Íconos según tipo: asignación, pago, estado actualizado
- Swipe para marcar como leída
- Botón [Marcar todas como leídas]
- Badge en tab con el contador de no leídas

---

## 9. NAVEGACIÓN — TAB NAVIGATOR

```typescript
// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../src/store/notification.store';

export default function AppLayout() {
  const unreadCount = useNotificationStore(s => s.unreadCount);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#ef4444' }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergencia',
          tabBarIcon: ({ color }) => <Ionicons name="warning" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Solicitudes',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alertas',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## 10. ROOT LAYOUT Y PROVIDERS

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../src/store/auth.store';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { STRIPE_PUBLISHABLE_KEY } from '../src/constants/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

export default function RootLayout() {
  const restoreSession = useAuthStore(s => s.restoreSession);
  usePushNotifications();

  useEffect(() => { restoreSession(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="payment/[assignmentId]" options={{ presentation: 'modal' }} />
          </Stack>
          <Toast />
        </StripeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

---

## 11. GUARD DE AUTENTICACIÓN

```typescript
// app/(app)/_layout.tsx — protección del grupo
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <AppTabsNavigator />;
}
```

---

## 12. `app.json` / CONFIGURACIÓN EXPO

```json
{
  "expo": {
    "name": "Emergencias Vehiculares",
    "slug": "emergencias-vehiculares",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "emergenciasveh",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.tuempresa.emergencias",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Necesitamos tu ubicación para encontrar talleres cercanos y reportar la emergencia.",
        "NSCameraUsageDescription": "Necesitamos acceso a la cámara para fotografiar el daño del vehículo.",
        "NSMicrophoneUsageDescription": "Necesitamos el micrófono para que puedas describir el problema en audio.",
        "NSPhotoLibraryUsageDescription": "Necesitamos acceso a tus fotos para adjuntar imágenes al reporte."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "package": "com.tuempresa.emergencias",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-camera",
        { "cameraPermission": "Necesitamos la cámara para fotografiar el daño." }
      ],
      [
        "expo-location",
        { "locationAlwaysAndWhenInUsePermission": "Necesitamos tu ubicación para encontrar talleres cercanos." }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ef4444",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "extra": {
      "eas": { "projectId": "TU_EAS_PROJECT_ID" }
    }
  }
}
```

---

## 13. `package.json` — Dependencias

```json
{
  "name": "emergencias-vehiculares-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.0",
    "react": "18.2.0",
    "react-native": "0.74.5",

    "expo-location": "~17.0.1",
    "expo-camera": "~15.0.16",
    "expo-av": "~14.0.7",
    "expo-image-picker": "~15.0.7",
    "expo-notifications": "~0.28.19",
    "expo-secure-store": "~13.0.2",
    "expo-device": "~6.0.2",

    "react-native-maps": "1.14.0",

    "@stripe/stripe-react-native": "0.37.3",

    "@tanstack/react-query": "^5.51.1",
    "zustand": "^4.5.5",
    "axios": "^1.7.7",

    "react-native-gesture-handler": "~2.17.1",
    "react-native-reanimated": "~3.10.1",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "react-native-toast-message": "^2.2.1",

    "nativewind": "^4.0.1",
    "tailwindcss": "^3.4.7",

    "@expo/vector-icons": "^14.0.4",
    "dayjs": "^1.11.13"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "typescript": "~5.3.3"
  }
}
```

---

## 14. FLUJO VISUAL COMPLETO DE LA APP

```
[Splash / Carga]
       │
       ├── Sin sesión ──→ [Login] ──→ [Registro]
       │                    │
       └── Con sesión ──────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   🗺️ RADAR (Home)       │ ← TAB 1
              │   Mapa + Talleres       │
              │   [REPORTAR]            │
              │   [BUSCAR TALLER]       │
              └─────────┬───────────────┘
                        │
             ┌──────────┴───────────┐
             │                      │
    [Toca REPORTAR]      [Toca BUSCAR TALLER]
             │                      │
             ▼                      ▼
  ┌─────────────────┐    BottomSheet con detalle
  │ Wizard Paso 1   │    del taller seleccionado
  │ Selecciona      │
  │ vehículo + GPS  │
  └────────┬────────┘
           │ POST /incidents/
           ▼
  ┌─────────────────┐
  │ Wizard Paso 2   │
  │ Foto + Audio    │
  │ + Texto         │
  └────────┬────────┘
           │ POST /incidents/{id}/evidence/
           │ (por cada evidencia)
           ▼
  ┌─────────────────────────────┐
  │ Seguimiento Tiempo Real     │ ← SSE activo
  │ Timeline estados            │
  │ Info taller asignado        │
  │ Mapa del incidente          │
  └────────┬────────────────────┘
           │
           ▼ (cuando status = completed)
  ┌─────────────────┐
  │ 💳 PAGAR        │ ← Modal Stripe
  │ Stripe CardField│
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ ⭐ CALIFICAR    │
  │ Taller (1-5)    │
  └─────────────────┘
```

---

## 15. CONSIDERACIONES TÉCNICAS

- **Expo Go vs Build**: En desarrollo usar Expo Go. Para producción usar `eas build` — algunas librerías (react-native-maps, stripe) requieren build nativo.
- **`react-native-maps`**: En Android requiere Google Maps SDK (API key en `app.json`). En iOS funciona con Apple Maps sin key.
- **Archivos multimedia**: Usar `expo-file-system` para leer el URI del archivo antes de enviarlo en FormData. Siempre verificar que el archivo exista antes del upload.
- **FormData en React Native**: No usar `Content-Type: application/json` en requests con archivos — dejar que Axios lo detecte automáticamente con `multipart/form-data`.
- **SSE sin EventSource nativo**: El hook `useSSE` usa `fetch` con `ReadableStream` que sí funciona en Hermes (motor JS de RN). Alternativa: usar `react-native-event-source` si se prefiere una librería.
- **Permisos iOS**: Todos los `NSUsageDescription` son obligatorios o Apple rechaza la app.
- **SecureStore**: Usar siempre `expo-secure-store` para tokens JWT — nunca `AsyncStorage` (no cifrado).
- **Deep linking**: Configurar el `scheme` en `app.json` para que los webhooks de Stripe puedan redirigir de vuelta a la app.
- **Offline**: Mostrar mensaje claro cuando no hay conexión antes de intentar crear un incidente.
- **TanStack Query**: Configurar `staleTime` apropiado — el radar de talleres puede tener 60s de caché, el estado del incidente activo 0s (siempre fresco vía SSE).
