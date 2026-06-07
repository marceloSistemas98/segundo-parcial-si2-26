import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Linking,
  Image,
  Pressable,
} from 'react-native';
import AppScreen from '../../../../src/components/ui/AppScreen';
import { COLORS } from '../../../../src/constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import EventSource from 'react-native-sse';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import Badge from '../../../../src/components/ui/Badge';
import Loading from '../../../../src/components/ui/Loading';
import { incidentsApi } from '../../../../src/api/incidents.api';
import { useIncidentStore } from '../../../../src/store/incident.store';
import { API_BASE_URL } from '../../../../src/constants/api';
import { notificationsApi } from '../../../../src/api/notifications.api';
import { resolveIncidentId, isLocalIncidentId } from '../../../../src/utils/incidentRoute';
import PendingIncidentStatus from '../../../../src/components/incident/PendingIncidentStatus';
import IncidentQuotesWorkshops from '../../../../src/components/incident/IncidentQuotesWorkshops';
import {
  formatRelativeTime,
  formatDate,
  getIncidentTypeLabel,
  getIncidentTypeIcon,
  getStatusLabel,
  getPriorityLabel,
  formatDistance,
  getStatusDescription,
  getAssignmentStatusLabel,
} from '../../../../src/utils/format';
import ClientLiveTrackingBlock from '../../../../src/components/incident/ClientLiveTrackingBlock';

function mediaUrl(fileField) {
  if (!fileField) return null;
  const path = typeof fileField === 'string' ? fileField : fileField;
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function IncidentStatusScreen() {
  const { id: routeId } = useLocalSearchParams();
  const activeIncidentId = useIncidentStore((s) => s.activeIncidentId);
  const activeIncident = useIncidentStore((s) => s.activeIncident);
  const incidentId = resolveIncidentId(routeId, activeIncidentId, activeIncident);
  const isLocal = isLocalIncidentId(incidentId);
  const localClientRequestId = isLocal ? incidentId.replace(/^local:/, '') : null;

  const queryClient = useQueryClient();
  const setActiveIncident = useIncidentStore((state) => state.setActiveIncident);

  useEffect(() => {
    let stream;
    let cancelled = false;

    const connectIncidentStream = async () => {
      if (!incidentId || isLocal) return;

      try {
        const streamUrl = await notificationsApi.getIncidentStreamUrl(incidentId);
        if (cancelled) return;
        stream = new EventSource(streamUrl);
        stream.addEventListener('message', (evt) => {
          try {
            const payload = JSON.parse(evt.data || '{}');
            if (payload.event === 'status_change' || payload.event === 'ai_complete') {
              queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
              queryClient.invalidateQueries({ queryKey: ['incident-assignment', incidentId] });
              queryClient.invalidateQueries({ queryKey: ['offered-workshops', incidentId] });
            }
          } catch {
            // ignore malformed events
          }
        });
      } catch {
        // fallback silencioso: ya existe polling por React Query
      }
    };

    connectIncidentStream();
    return () => {
      cancelled = true;
      try {
        stream?.close?.();
      } catch {
        // ignore
      }
    };
  }, [incidentId, isLocal, queryClient]);

  const { data: incident, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: async () => {
      const { data } = await incidentsApi.getById(incidentId);
      return data;
    },
    enabled: !!incidentId && !isLocal,
    refetchInterval: 8000,
  });

  const { data: assignment } = useQuery({
    queryKey: ['incident-assignment', incidentId],
    queryFn: async () => {
      try {
        const { data } = await incidentsApi.getAssignment(incidentId);
        return data;
      } catch (e) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!incidentId && !isLocal,
    refetchInterval: 10000,
  });

  const effectiveAssignment = useMemo(() => {
    const nested = incident?.assignment ?? null;
    if (!assignment && !nested) return null;
    if (!assignment) return nested;
    if (!nested) return assignment;
    return { ...nested, ...assignment };
  }, [assignment, incident]);

  const cancelMutation = useMutation({
    mutationFn: () => incidentsApi.cancel(incidentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      Toast.show({
        type: 'success',
        text1: 'Incidente cancelado',
        text2: 'Tu solicitud ha sido cancelada',
      });
      router.replace('/(app)/home');
    },
    onError: (err) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.error || 'Error al cancelar el incidente',
      });
    },
  });

  useEffect(() => {
    if (incident) {
      setActiveIncident(incident);
    }
  }, [incident, setActiveIncident]);

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Emergencia',
      '¿Estás seguro de que deseas cancelar esta solicitud?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const handleCallWorkshop = () => {
    const phone = effectiveAssignment?.workshop?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
    }
  };

  const handleOpenMaps = () => {
    if (!incident?.latitude || !incident?.longitude) return;
    const lat = Number(incident.latitude);
    const lng = Number(incident.longitude);
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  const handlePayment = () => {
    if (effectiveAssignment?.id) {
      router.push(`/payment/${effectiveAssignment.id}`);
    }
  };

  if (!incidentId) {
    return (
      <AppScreen className="items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color={COLORS.primary} />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          No se encontró el incidente
        </Text>
        <Text className="text-dark-600 text-center mt-2">
          Vuelve al flujo de emergencia o elige el incidente desde solicitudes.
        </Text>
        <Button
          title="Ir al inicio"
          onPress={() => router.replace('/(app)/home')}
          variant="primary"
          size="md"
          className="mt-6"
        />
      </AppScreen>
    );
  }

  if (isLocal && localClientRequestId) {
    return (
      <AppScreen>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Button title="← Volver" onPress={() => router.back()} variant="ghost" size="sm" />
          <Text className="text-dark-900 font-bold text-2xl mt-2 mb-4">Emergencia (local)</Text>
          <PendingIncidentStatus localClientRequestId={localClientRequestId} />
        </ScrollView>
      </AppScreen>
    );
  }

  if (isLoading) {
    return <Loading fullScreen message="Cargando detalles del incidente..." />;
  }

  if (isError || !incident) {
    return (
      <AppScreen className="items-center justify-center px-6">
        <Ionicons name="cloud-offline" size={64} color={COLORS.primary} />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          No pudimos cargar el incidente
        </Text>
        <Text className="text-dark-600 text-sm text-center mt-2">
          {error?.response?.data?.detail || error?.message || 'Revisa tu conexión e intenta de nuevo.'}
        </Text>
        <Button
          title="Reintentar"
          onPress={() => refetch()}
          variant="primary"
          size="md"
          className="mt-4"
        />
        <Button
          title="Volver al inicio"
          onPress={() => router.replace('/(app)/home')}
          variant="outline"
          size="md"
          className="mt-3"
        />
      </AppScreen>
    );
  }

  const typeKey = incident.incident_type || 'uncertain';
  const typeLabel = getIncidentTypeLabel(typeKey);
  const typeIcon = getIncidentTypeIcon(typeKey);
  const vehicleLine =
    incident.vehicle_info ||
    (typeof incident.vehicle === 'object' && incident.vehicle
      ? `${incident.vehicle.brand} ${incident.vehicle.model} (${incident.vehicle.plate})`
      : incident.vehicle
        ? `Vehículo #${incident.vehicle}`
        : null);

  const evidences = Array.isArray(incident.evidences) ? incident.evidences : [];
  const imageEvidences = evidences.filter((e) => e.evidence_type === 'image');
  const audioEvidences = evidences.filter((e) => e.evidence_type === 'audio');
  const history = Array.isArray(incident.status_history) ? incident.status_history : [];

  const canCancel = ['pending', 'analyzing', 'waiting_workshop'].includes(incident.status);
  const showPayment =
    incident.status === 'completed' &&
    effectiveAssignment?.id &&
    effectiveAssignment?.service_cost != null;

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        nestedScrollEnabled
      >
        <View className="flex-row items-center justify-between mb-2">
          <Button
            title="← Volver"
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
          <Badge
            label={getStatusLabel(incident.status)}
            variant={incident.status}
            type="status"
            size="md"
          />
        </View>

        <Text className="text-dark-900 font-bold text-2xl mb-1">
          Emergencia #{incident.id}
        </Text>
        <Text className="text-dark-500 text-sm mb-1">
          Creado {formatDate(incident.created_at)} · {formatRelativeTime(incident.created_at)}
        </Text>

        <Card className="p-4 mb-4 border-l-4 border-l-primary-500">
          <View className="flex-row items-start">
            <View className="w-14 h-14 rounded-2xl bg-primary-100 items-center justify-center mr-3">
              <Ionicons name={typeIcon} size={28} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-dark-900 font-bold text-lg">{typeLabel}</Text>
              {incident.priority ? (
                <Badge
                  label={getPriorityLabel(incident.priority)}
                  variant={incident.priority}
                  type="priority"
                  size="sm"
                  className="mt-2"
                />
              ) : null}
            </View>
          </View>
          <Text className="text-dark-600 text-sm leading-6 mt-4">
            {getStatusDescription(incident.status)}
          </Text>
        </Card>

        <IncidentQuotesWorkshops
          incidentId={String(incident.id)}
          incidentStatus={incident.status}
        />

        <ClientLiveTrackingBlock
          incidentId={incident.id}
          incidentStatus={incident.status}
          incidentLat={incident.latitude}
          incidentLng={incident.longitude}
          assignment={effectiveAssignment}
        />

        {incident.status === 'analyzing' ? (
          <Card className="p-4 mb-4 bg-violet-50 border-violet-200">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={22} color="#7c3aed" />
              <Text className="text-violet-900 font-semibold ml-2">
                Analizando con IA...
              </Text>
            </View>
            <Text className="text-violet-800 text-sm mt-2">
              Estamos procesando tu audio e imágenes para detectar el tipo de emergencia.
            </Text>
          </Card>
        ) : null}

        {incident.description ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-2">Tu descripción</Text>
            <Text className="text-dark-600 text-sm leading-6">{incident.description}</Text>
          </Card>
        ) : null}

        {vehicleLine ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-2">Vehículo</Text>
            <View className="flex-row items-center">
              <Ionicons name="car-sport" size={22} color="#64748b" />
              <Text className="text-dark-700 ml-2 flex-1">{vehicleLine}</Text>
            </View>
          </Card>
        ) : null}

        <Card className="p-4 mb-4">
          <Text className="text-dark-900 font-semibold mb-2">Ubicación del incidente</Text>
          <Text className="text-dark-600 text-sm mb-3">
            {incident.address_text?.trim() ||
              `Coordenadas: ${Number(incident.latitude).toFixed(5)}, ${Number(incident.longitude).toFixed(5)}`}
          </Text>
          <Button
            title="Abrir en mapa"
            onPress={handleOpenMaps}
            variant="outline"
            size="md"
            icon="map"
            full
          />
        </Card>

        {evidences.length > 0 ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-1">Evidencias enviadas</Text>
            <Text className="text-dark-500 text-xs mb-3">
              {imageEvidences.length} foto(s)
              {audioEvidences.length ? ` · ${audioEvidences.length} audio(s)` : ''}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {imageEvidences.map((ev) => {
                  const uri = mediaUrl(ev.file);
                  return uri ? (
                    <Image
                      key={ev.id}
                      source={{ uri }}
                      className="w-24 h-24 rounded-xl bg-dark-100"
                    />
                  ) : null;
                })}
                {audioEvidences.length > 0 ? (
                  <View className="w-24 h-24 rounded-xl bg-violet-100 items-center justify-center">
                    <Ionicons name="mic" size={32} color="#7c3aed" />
                    <Text className="text-violet-800 text-xs mt-1">Audio</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </Card>
        ) : null}

        {effectiveAssignment?.workshop ? (
          <Card className="p-4 mb-4 bg-emerald-50 border-emerald-200">
            <Text className="text-dark-900 font-semibold mb-1">Taller asignado</Text>
            <View className="self-start bg-emerald-600 px-3 py-1 rounded-full mb-3">
              <Text className="text-white text-xs font-semibold">
                {getAssignmentStatusLabel(effectiveAssignment.status)}
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <View className="w-12 h-12 rounded-full bg-emerald-500 items-center justify-center mr-3">
                <Ionicons name="construct" size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-dark-900 font-bold text-base">
                  {effectiveAssignment.workshop.name}
                </Text>
                {effectiveAssignment.distance_km != null && effectiveAssignment.distance_km !== '' ? (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="navigate" size={14} color="#64748b" />
                    <Text className="text-dark-600 text-sm ml-1">
                      {formatDistance(Number(effectiveAssignment.distance_km))}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            {effectiveAssignment.workshop.address ? (
              <Text className="text-dark-600 text-sm mb-2">{effectiveAssignment.workshop.address}</Text>
            ) : null}
            {effectiveAssignment.workshop.phone ? (
              <View className="flex-row items-center mb-2">
                <Ionicons name="call" size={16} color="#64748b" />
                <Text className="text-dark-700 ml-2">{effectiveAssignment.workshop.phone}</Text>
              </View>
            ) : null}
            {effectiveAssignment.technician?.name ? (
              <Text className="text-dark-600 text-sm mb-3">
                Técnico: {effectiveAssignment.technician.name}
                {effectiveAssignment.technician.phone ? ` · ${effectiveAssignment.technician.phone}` : ''}
              </Text>
            ) : effectiveAssignment.technician_name ? (
              <Text className="text-dark-600 text-sm mb-3">
                Técnico: {effectiveAssignment.technician_name}
              </Text>
            ) : null}
            {effectiveAssignment.estimated_arrival_minutes != null ? (
              <Text className="text-dark-600 text-sm mb-3">
                ETA aproximado: {effectiveAssignment.estimated_arrival_minutes} min
              </Text>
            ) : null}
            {effectiveAssignment.service_cost != null ? (
              <Text className="text-dark-800 font-semibold text-sm mb-3">
                Costo del servicio: Bs. {effectiveAssignment.service_cost}
              </Text>
            ) : null}
            {effectiveAssignment.workshop.phone ? (
              <Button
                title="Llamar al taller"
                onPress={handleCallWorkshop}
                variant="primary"
                size="md"
                icon="call"
                full
              />
            ) : null}
          </Card>
        ) : (
          ['assigned', 'in_progress'].includes(incident.status) && (
            <Card className="p-4 mb-4 bg-amber-50 border-amber-200">
              <Text className="text-dark-800 text-sm">
                Aún no hay datos de taller visibles. Actualizamos esta pantalla cada pocos segundos.
              </Text>
              <Pressable onPress={() => refetch()} className="mt-2">
                <Text className="text-primary-600 font-semibold text-sm">Actualizar ahora</Text>
              </Pressable>
            </Card>
          )
        )}

        {incident.status === 'in_progress' ? (
          <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
            <View className="flex-row items-center">
              <Ionicons name="construct" size={24} color="#2563eb" />
              <Text className="text-dark-900 font-semibold ml-3 flex-1">
                El taller está trabajando en tu vehículo
              </Text>
            </View>
          </Card>
        ) : null}

        {incident.status === 'completed' ? (
          <Card className="p-4 mb-4 bg-green-50 border-green-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text className="text-dark-900 font-bold text-lg ml-3">Servicio completado</Text>
            </View>
            <Text className="text-dark-600 text-sm">
              El taller cerró el servicio. Si aplica, puedes proceder al pago abajo.
            </Text>
          </Card>
        ) : null}

        {history.length > 0 ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-3">Historial de estado</Text>
            {history.map((h, idx) => (
              <View
                key={h.id || idx}
                className={`pb-3 mb-3 ${idx < history.length - 1 ? 'border-b border-dark-100' : ''}`}
              >
                <Text className="text-dark-800 text-sm font-medium">
                  {getStatusLabel(h.new_status)}
                </Text>
                <Text className="text-dark-500 text-xs mt-1">
                  {formatDate(h.changed_at)}
                  {h.changed_by_name ? ` · ${h.changed_by_name}` : ''}
                </Text>
                {h.notes ? (
                  <Text className="text-dark-600 text-xs mt-1">{h.notes}</Text>
                ) : null}
              </View>
            ))}
          </Card>
        ) : null}

        {showPayment ? (
          <Button
            title="Pagar servicio"
            onPress={handlePayment}
            variant="primary"
            size="lg"
            icon="card"
            full
            className="mb-4"
          />
        ) : null}

        {canCancel ? (
          <Button
            title="Cancelar emergencia"
            onPress={handleCancel}
            variant="danger"
            size="md"
            icon="close-circle"
            full
            loading={cancelMutation.isPending}
            className="mt-2"
          />
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
