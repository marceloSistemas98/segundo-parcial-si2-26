import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { technicianApi } from '../../../src/technician/api/technician.api';
import { useIncidentTrackingSocket } from '../../../src/realtime/useIncidentTrackingSocket';
import OpenStreetRouteMapView from '../../../src/components/maps/OpenStreetRouteMapView';
import { fetchOsrmDrivingRoute, formatRouteSummary, straightLineRoute } from '../../../src/utils/osrmRoute';
import Loading from '../../../src/components/ui/Loading';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import {
  getIncidentTypeLabel,
  getAssignmentStatusLabel,
  getStatusDescription,
} from '../../../src/utils/format';
import { parseLatLng } from '../../../src/utils/geo';

/** Incluye `accepted` para que el WS abra en cuanto hay orden; el cliente ya escucha en ese estado. */
const TRACKING_STATUSES = ['accepted', 'in_route', 'arrived', 'in_service'];
/** Estados donde el mapa necesita GPS del dispositivo aunque el WS aún no haya devuelto eco. */
const MAP_LOCAL_GPS_STATUSES = ['accepted', 'in_route', 'arrived', 'in_service'];

const STATUS_FLOW = [
  { key: 'accepted', label: 'Asignado', icon: 'checkmark-circle' },
  { key: 'in_route', label: 'En camino', icon: 'navigate' },
  { key: 'arrived', label: 'En sitio', icon: 'location' },
  { key: 'in_service', label: 'En servicio', icon: 'construct' },
];

function nextAction(status) {
  if (status === 'accepted') return { next: 'in_route', label: 'Marcar: en camino hacia el cliente' };
  if (status === 'in_route') return { next: 'arrived', label: 'Marcar: ya llegué' };
  if (status === 'arrived') return { next: 'in_service', label: 'Iniciar servicio en sitio' };
  return null;
}

function statusStepIndex(status) {
  if (status === 'completed') return STATUS_FLOW.length;
  const i = STATUS_FLOW.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

export default function TechnicianAssignmentScreen() {
  const params = useLocalSearchParams();
  const rawId = params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const assignmentId = idStr ? Number(idStr) : null;
  const queryClient = useQueryClient();
  const [echoLoc, setEchoLoc] = useState(null);
  /** GPS del dispositivo en “Asignado” (antes de “En camino”) para dibujar tú → cliente en el mapa. */
  const [localPreviewLoc, setLocalPreviewLoc] = useState(null);

  const { data: row, isLoading, isError } = useQuery({
    queryKey: ['technician-assignment', assignmentId],
    queryFn: async () => {
      const { data } = await technicianApi.getAssignment(assignmentId);
      return data;
    },
    enabled: !!assignmentId,
  });

  const incident = row?.incident;
  const incidentId = incident?.id;

  const broadcastTracking = useMemo(() => {
    if (!row) return false;
    return TRACKING_STATUSES.includes(row.status);
  }, [row]);

  useIncidentTrackingSocket({
    incidentId,
    mode: 'broadcast',
    enabled: !!incidentId && broadcastTracking,
    onTechnicianLocation: (loc) => setEchoLoc(loc),
    locationPingMs: 10_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, notes }) => technicianApi.updateAssignmentStatus(assignmentId, { status, notes }),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['technician-assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['technician-assignments'] });
      Toast.show({ type: 'success', text1: 'Estado actualizado', text2: v.status });
    },
    onError: (err) => {
      Toast.show({
        type: 'error',
        text1: 'No se pudo actualizar',
        text2: err.response?.data?.error || 'Intenta de nuevo',
      });
    },
  });

  const action = row ? nextAction(row.status) : null;

  const incidentCoords = incident
    ? parseLatLng(incident.latitude, incident.longitude)
    : { lat: null, lng: null };
  const clientLat = incidentCoords.lat;
  const clientLng = incidentCoords.lng;

  const workshopCoords = parseLatLng(row?.workshop?.latitude, row?.workshop?.longitude);
  const wLat = workshopCoords.lat;
  const wLng = workshopCoords.lng;

  const techStored = parseLatLng(
    row?.technician?.current_latitude,
    row?.technician?.current_longitude
  );

  useEffect(() => {
    if (
      !row?.status ||
      !MAP_LOCAL_GPS_STATUSES.includes(row.status) ||
      clientLat == null ||
      clientLng == null
    ) {
      setLocalPreviewLoc(null);
      return undefined;
    }
    let cancelled = false;
    let intervalId;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const tick = async () => {
        if (cancelled) return;
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) {
            const p = parseLatLng(pos.coords.latitude, pos.coords.longitude);
            if (p.lat != null && p.lng != null) {
              setLocalPreviewLoc({ latitude: p.lat, longitude: p.lng });
            }
          }
        } catch {
          // sin fix momentáneo
        }
      };
      await tick();
      intervalId = setInterval(tick, 12_000);
    })();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [row?.status, clientLat, clientLng]);

  const techResolved = parseLatLng(
    echoLoc?.latitude ?? localPreviewLoc?.latitude ?? techStored.lat,
    echoLoc?.longitude ?? localPreviewLoc?.longitude ?? techStored.lng
  );
  const deviceTechLat = techResolved.lat;
  const deviceTechLng = techResolved.lng;

  const usingWorkshopOrigin =
    row?.status === 'accepted' &&
    echoLoc == null &&
    localPreviewLoc == null &&
    techStored.lat == null &&
    wLat != null &&
    wLng != null;

  const routeOrigin =
    row?.status === 'accepted' && deviceTechLat == null && wLat != null && wLng != null
      ? { lat: wLat, lng: wLng }
      : deviceTechLat != null && deviceTechLng != null
        ? { lat: deviceTechLat, lng: deviceTechLng }
        : null;

  const osrmKey = useMemo(() => {
    if (clientLat == null || clientLng == null || !routeOrigin) return null;
    const q = (x) => Math.round(Number(x) * 400) / 400;
    return [q(routeOrigin.lat), q(routeOrigin.lng), q(clientLat), q(clientLng)].join('|');
  }, [routeOrigin, clientLat, clientLng]);

  const { data: routeData, isFetching: routeLoading } = useQuery({
    queryKey: ['osrm-route-tech', osrmKey],
    queryFn: () => fetchOsrmDrivingRoute(routeOrigin.lat, routeOrigin.lng, clientLat, clientLng),
    enabled: osrmKey != null,
    staleTime: 50_000,
  });

  const routeFromOsrm = routeData?.coordinates ?? null;
  const lineFallback =
    routeOrigin && clientLat != null && clientLng != null
      ? straightLineRoute(routeOrigin.lat, routeOrigin.lng, clientLat, clientLng)
      : null;
  const routeCoords =
    routeFromOsrm && routeFromOsrm.length > 1 ? routeFromOsrm : lineFallback;
  const routeSummary = formatRouteSummary(routeData?.distanceM, routeData?.durationS);

  if (!assignmentId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-dark-600">Orden inválida</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !row) {
    return <Loading fullScreen message="Cargando orden..." />;
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-dark-800 text-center">No se pudo cargar la orden.</Text>
        <Button title="Volver" onPress={() => router.back()} className="mt-4" />
      </SafeAreaView>
    );
  }

  const typeKey = incident?.incident_type || 'uncertain';
  const stepIdx = statusStepIndex(row.status);
  const allStepsDone = row.status === 'completed';

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top']}>
      <View className="flex-row items-center px-2 py-3 bg-white border-b border-slate-200 shadow-sm">
        <Button title="←" variant="ghost" size="sm" onPress={() => router.back()} />
        <View className="flex-1 items-center pr-8">
          <Text className="text-dark-500 text-xs font-medium uppercase tracking-wide">Orden activa</Text>
          <Text className="text-dark-900 font-bold text-lg">#{row.id}</Text>
          {row.technician?.name ? (
            <Text className="text-emerald-800 text-xs font-semibold mt-0.5">{row.technician.name}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {clientLat != null && clientLng != null ? (
          <View className="bg-white mb-3">
            <View className="px-4 pt-4 pb-2">
              <Text className="text-dark-900 font-bold text-lg">Ruta hacia el cliente</Text>
              <Text className="text-dark-600 text-sm mt-1 leading-5">
                OpenStreetMap: trazo por calles (OSRM). Tu posición se comparte en vivo cuando estás en
                &quot;En camino&quot; o después; el cliente recibe aviso si estás cerca (~450 m).
              </Text>
              {routeSummary ? (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="analytics-outline" size={18} color="#059669" />
                  <Text className="text-emerald-800 font-semibold text-sm ml-2">{routeSummary}</Text>
                  {routeLoading ? (
                    <Text className="text-dark-400 text-xs ml-2">actualizando…</Text>
                  ) : null}
                </View>
              ) : routeOrigin ? (
                <Text className="text-dark-500 text-xs mt-2">
                  {routeLoading
                    ? 'Calculando ruta por calles (OSRM)…'
                    : 'Si el trazado por calles no está disponible, verás una línea aproximada.'}
                </Text>
              ) : (
                <Text className="text-amber-700 text-xs mt-2">
                  Activa &quot;En camino&quot; para enviar tu GPS al cliente y trazar la ruta en tiempo real.
                </Text>
              )}
            </View>
            <OpenStreetRouteMapView
              destinationLat={clientLat}
              destinationLng={clientLng}
              originLat={routeOrigin?.lat ?? null}
              originLng={routeOrigin?.lng ?? null}
              routeCoordinates={routeCoords}
              height={320}
              destinationTitle="Cliente / incidente"
              originTitle={usingWorkshopOrigin ? 'Taller (aprox.)' : 'Tú (GPS)'}
            />
            <Text className="text-dark-400 text-[11px] px-4 py-2 bg-slate-50 leading-4">
              Rojo: incidente ({clientLat?.toFixed(5)}, {clientLng?.toFixed(5)}). Verde:{' '}
              {routeOrigin
                ? `${usingWorkshopOrigin ? 'taller' : 'tu posición'} (${routeOrigin.lat.toFixed(
                    5
                  )}, ${routeOrigin.lng.toFixed(5)})`
                : 'sin origen (activa “En camino” o permite ubicación en “Asignado”)'}
              . Toca los pins para ver coordenadas. GPS al cliente cada ~10 s en &quot;En camino&quot;.
            </Text>
          </View>
        ) : (
          <View className="mx-4 mb-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <Text className="text-amber-900 text-sm font-semibold">Sin coordenadas del incidente</Text>
            <Text className="text-amber-800 text-xs mt-1">
              El backend no devolvió lat/lng válidos. Revisa el reporte del cliente.
            </Text>
          </View>
        )}

        <View className="px-4 mb-3">
          <Text className="text-dark-500 text-xs font-semibold mb-2 uppercase">Progreso</Text>
          <View className="flex-row justify-between">
            {STATUS_FLOW.map((s, i) => {
              const done = allStepsDone || i < stepIdx;
              const current = !allStepsDone && i === stepIdx;
              return (
                <View key={s.key} className="items-center flex-1 max-w-[25%]">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      done || current ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <Ionicons
                      name={s.icon}
                      size={20}
                      color={done || current ? '#fff' : '#94a3b8'}
                    />
                  </View>
                  <Text
                    className={`text-[10px] text-center mt-1.5 font-semibold leading-3 ${
                      current ? 'text-emerald-800' : 'text-dark-500'
                    }`}
                    numberOfLines={2}
                  >
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="px-4">
          <Card className="p-4 mb-3 bg-white border border-slate-100">
            <Text className="text-dark-500 text-xs font-semibold mb-1">Estado</Text>
            <Text className="text-emerald-800 font-bold text-xl">{getAssignmentStatusLabel(row.status)}</Text>
            <Text className="text-dark-600 text-sm mt-2 leading-5">
              {incident ? getStatusDescription(incident.status) : ''}
            </Text>
            {row.estimated_arrival_minutes != null ? (
              <View className="flex-row items-center mt-3 pt-3 border-t border-slate-100">
                <Ionicons name="time-outline" size={20} color="#64748b" />
                <Text className="text-dark-800 text-sm ml-2 font-medium">
                  ETA informado al cliente: ~{row.estimated_arrival_minutes} min
                </Text>
              </View>
            ) : null}
          </Card>

          <Card className="p-4 mb-3 bg-white border border-slate-100">
            <Text className="text-dark-900 font-bold text-base mb-2">Incidente</Text>
            <Text className="text-dark-700 text-sm mb-1">Tipo: {getIncidentTypeLabel(typeKey)}</Text>
            {incident?.address_text ? (
              <Text className="text-dark-600 text-sm mb-2 leading-5">{incident.address_text}</Text>
            ) : null}
            {incident?.description ? (
              <Text className="text-dark-600 text-sm leading-5">{incident.description}</Text>
            ) : null}
            {incident?.vehicle_info ||
            (typeof incident?.vehicle === 'object' && incident.vehicle) ? (
              <View className="flex-row items-center mt-3 pt-3 border-t border-slate-100">
                <Ionicons name="car-sport-outline" size={22} color="#64748b" />
                <Text className="text-dark-800 text-sm ml-2 flex-1">
                  {incident.vehicle_info ||
                    (incident.vehicle
                      ? `${incident.vehicle.brand || ''} ${incident.vehicle.model || ''}${
                          incident.vehicle.plate ? ` · ${incident.vehicle.plate}` : ''
                        }`.trim()
                      : '')}
                </Text>
              </View>
            ) : null}
          </Card>

          {row.workshop ? (
            <Card className="p-4 mb-3 bg-white border border-slate-100">
              <Text className="text-dark-900 font-bold text-base mb-1">{row.workshop.name}</Text>
              <Text className="text-dark-600 text-sm">{row.workshop.phone}</Text>
            </Card>
          ) : null}

          {action ? (
            <Button
              title={action.label}
              onPress={() => {
                Alert.alert('Confirmar', `¿Actualizar a "${action.label}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sí',
                    onPress: () => statusMutation.mutate({ status: action.next, notes: '' }),
                  },
                ]);
              }}
              loading={statusMutation.isPending}
              full
              size="lg"
              icon="navigate"
            />
          ) : (
            <Card className="p-4 bg-slate-200/60 border border-slate-200">
              <Text className="text-dark-700 text-sm leading-5">
                {row.status === 'completed'
                  ? 'Servicio cerrado por el taller. Costo y pago los gestiona el dueño desde el portal web.'
                  : 'No hay más acciones desde la app. Contacta a tu taller si necesitas ayuda.'}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
