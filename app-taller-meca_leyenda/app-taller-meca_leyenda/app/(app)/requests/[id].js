import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import AppScreen from '../../../src/components/ui/AppScreen';
import PageHeader from '../../../src/components/ui/PageHeader';
import { COLORS } from '../../../src/constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Badge from '../../../src/components/ui/Badge';
import Loading from '../../../src/components/ui/Loading';
import { incidentsApi } from '../../../src/api/incidents.api';
import { useIncidentStore } from '../../../src/store/incident.store';
import { resolveIncidentId } from '../../../src/utils/incidentRoute';
import { resolveMediaUrl } from '../../../src/utils/media';
import { formatApiError } from '../../../src/utils/apiErrors';
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
} from '../../../src/utils/format';
import ClientLiveTrackingBlock from '../../../src/components/incident/ClientLiveTrackingBlock';
import IncidentQuotesWorkshops from '../../../src/components/incident/IncidentQuotesWorkshops';

export default function RequestDetailScreen() {
  const { id: routeId } = useLocalSearchParams();
  const activeIncidentId = useIncidentStore((s) => s.activeIncidentId);
  const activeIncident = useIncidentStore((s) => s.activeIncident);
  const incidentId = resolveIncidentId(routeId, activeIncidentId, activeIncident);

  const queryClient = useQueryClient();

  const { data: incident, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: async () => {
      const { data } = await incidentsApi.getById(incidentId);
      return data;
    },
    enabled: !!incidentId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      if (!s || s === 'completed' || s === 'cancelled') return false;
      return 8000;
    },
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
    enabled: !!incidentId,
    refetchInterval: (q) => {
      const st = q.state.data?.status;
      if (st === 'completed') return false;
      return 10000;
    },
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
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      Toast.show({
        type: 'success',
        text1: 'Solicitud cancelada',
        text2: 'Tu solicitud ha sido cancelada correctamente',
      });
    },
    onError: (err) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.error || formatApiError(err.response?.data) || 'No se pudo cancelar',
      });
    },
  });

  const handleCancel = () => {
    Alert.alert(
      'Cancelar solicitud',
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

  const handleOpenMaps = () => {
    if (!incident?.latitude || !incident?.longitude) return;
    const lat = Number(incident.latitude);
    const lng = Number(incident.longitude);
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  if (!incidentId) {
    return (
      <AppScreen className="items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.primary} />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          Solicitud no válida
        </Text>
        <Button title="Volver" onPress={() => router.back()} variant="primary" className="mt-6" />
      </AppScreen>
    );
  }

  if (isLoading) {
    return <Loading fullScreen message="Cargando solicitud..." />;
  }

  if (isError || !incident) {
    return (
      <AppScreen className="items-center justify-center px-6">
        <Ionicons name="cloud-offline-outline" size={64} color={COLORS.primary} />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          No se pudo cargar la solicitud
        </Text>
        <Text className="text-dark-600 text-sm text-center mt-2">
          {formatApiError(error?.response?.data) || error?.message}
        </Text>
        <Button title="Reintentar" onPress={() => refetch()} variant="primary" className="mt-4" />
        <Button title="Volver" onPress={() => router.back()} variant="outline" className="mt-2" />
      </AppScreen>
    );
  }

  const typeKey = incident.incident_type || 'uncertain';
  const vehicleLine =
    incident.vehicle_info ||
    (typeof incident.vehicle === 'object' && incident.vehicle
      ? `${incident.vehicle.brand} ${incident.vehicle.model} (${incident.vehicle.plate})`
      : incident.vehicle
        ? `Vehículo #${incident.vehicle}`
        : null);

  const evidences = Array.isArray(incident.evidences) ? incident.evidences : [];
  const imageEvidences = evidences.filter((e) => e.evidence_type === 'image');
  const audioCount = evidences.filter((e) => e.evidence_type === 'audio').length;
  const history = Array.isArray(incident.status_history) ? incident.status_history : [];

  const paymentObj =
    effectiveAssignment && typeof effectiveAssignment.payment === 'object'
      ? effectiveAssignment.payment
      : null;
  const paymentStatus = paymentObj?.status;
  const ratingInfo = effectiveAssignment?.rating || effectiveAssignment?.client_rating;

  const canCancel = ['pending', 'analyzing', 'waiting_workshop'].includes(incident.status);
  const showPayment =
    incident.status === 'completed' &&
    effectiveAssignment?.id &&
    effectiveAssignment?.service_cost != null &&
    paymentStatus === 'pending';
  const showRate =
    incident.status === 'completed' &&
    effectiveAssignment?.id &&
    paymentStatus === 'client_paid' &&
    !ratingInfo?.score;

  const handleCallWorkshop = () => {
    const phone = effectiveAssignment?.workshop?.phone;
    if (phone) Linking.openURL(`tel:${String(phone).replace(/\s/g, '')}`);
  };

  const handlePayment = () => {
    const aid = effectiveAssignment?.id;
    if (aid) router.push(`/payment/${aid}`);
  };

  const handleRate = () => {
    const aid = effectiveAssignment?.id;
    if (aid) router.push(`/rate/${aid}`);
  };

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        nestedScrollEnabled
      >
        <View className="flex-row items-center justify-between mb-2">
          <Button title="← Volver" onPress={() => router.back()} variant="ghost" size="sm" />
          <Badge
            label={getStatusLabel(incident.status)}
            variant={incident.status}
            type="status"
            size="md"
          />
        </View>

        <Text className="text-dark-900 font-bold text-2xl mb-1">Solicitud #{incident.id}</Text>
        <Text className="text-dark-500 text-sm mb-4">
          Abierta el {formatDate(incident.created_at)} · {formatRelativeTime(incident.created_at)}
          {incident.updated_at && incident.updated_at !== incident.created_at
            ? ` · Actualizada ${formatRelativeTime(incident.updated_at)}`
            : ''}
        </Text>

        <Card className="p-4 mb-4 border-l-4 border-l-primary-500">
          <View className="flex-row items-start">
            <View className="w-14 h-14 rounded-2xl bg-primary-100 items-center justify-center mr-3">
              <Ionicons name={getIncidentTypeIcon(typeKey)} size={28} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-dark-900 font-bold text-lg">
                {getIncidentTypeLabel(typeKey)}
              </Text>
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

        <ClientLiveTrackingBlock
          incidentId={incident.id}
          incidentStatus={incident.status}
          incidentLat={incident.latitude}
          incidentLng={incident.longitude}
          assignment={effectiveAssignment}
        />

        <IncidentQuotesWorkshops
          incidentId={String(incident.id)}
          incidentStatus={incident.status}
        />

        {incident.description ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-2">Descripción que enviaste</Text>
            <Text className="text-dark-700 text-sm leading-6">{incident.description}</Text>
          </Card>
        ) : null}

        {vehicleLine ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-2">Vehículo involucrado</Text>
            <View className="flex-row items-center">
              <Ionicons name="car-sport-outline" size={22} color="#64748b" />
              <Text className="text-dark-800 ml-2 flex-1">{vehicleLine}</Text>
            </View>
          </Card>
        ) : null}

        <Card className="p-4 mb-4">
          <Text className="text-dark-900 font-semibold mb-2">Ubicación reportada</Text>
          <Text className="text-dark-600 text-sm mb-3">
            {incident.address_text?.trim() ||
              `Lat ${Number(incident.latitude).toFixed(5)}, Lng ${Number(incident.longitude).toFixed(5)}`}
          </Text>
          <Button title="Ver en mapa" onPress={handleOpenMaps} variant="outline" size="md" icon="map" full />
        </Card>

        {evidences.length > 0 ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-1">Evidencias</Text>
            <Text className="text-dark-500 text-xs mb-3">
              {imageEvidences.length} imagen(es)
              {audioCount ? ` · ${audioCount} audio(s)` : ''}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {imageEvidences.map((ev) => {
                  const uri = resolveMediaUrl(ev.file);
                  return uri ? (
                    <Image key={ev.id} source={{ uri }} className="w-28 h-28 rounded-xl bg-dark-100" />
                  ) : null;
                })}
                {audioCount > 0 ? (
                  <View className="w-28 h-28 rounded-xl bg-violet-100 items-center justify-center">
                    <Ionicons name="mic-outline" size={28} color="#7c3aed" />
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
            <Text className="text-dark-900 font-bold text-lg mb-1">{effectiveAssignment.workshop.name}</Text>
            {effectiveAssignment.distance_km != null && effectiveAssignment.distance_km !== '' ? (
              <Text className="text-dark-600 text-sm mb-2">
                Distancia aproximada: {formatDistance(Number(effectiveAssignment.distance_km))}
              </Text>
            ) : null}
            {effectiveAssignment.workshop.address ? (
              <Text className="text-dark-700 text-sm mb-2">{effectiveAssignment.workshop.address}</Text>
            ) : null}
            {effectiveAssignment.workshop.phone ? (
              <Text className="text-dark-700 text-sm mb-2">Tel. {effectiveAssignment.workshop.phone}</Text>
            ) : null}
            {effectiveAssignment.technician?.name ? (
              <Text className="text-dark-600 text-sm mb-2">
                Técnico: {effectiveAssignment.technician.name}
                {effectiveAssignment.technician.phone ? ` (${effectiveAssignment.technician.phone})` : ''}
              </Text>
            ) : null}
            {effectiveAssignment.estimated_arrival_minutes != null ? (
              <Text className="text-dark-600 text-sm mb-2">
                Tiempo estimado de llegada: ~{effectiveAssignment.estimated_arrival_minutes} min
              </Text>
            ) : null}
            {effectiveAssignment.service_cost != null ? (
              <Text className="text-dark-900 font-bold text-base mb-3">
                Costo del servicio: Bs. {effectiveAssignment.service_cost}
              </Text>
            ) : null}
            {ratingInfo?.score ? (
              <View className="mb-3 flex-row items-center">
                <Ionicons name="star" size={20} color="#fbbf24" />
                <Text className="text-dark-800 font-semibold ml-2">
                  Calificación: {ratingInfo.score} estrellas
                </Text>
              </View>
            ) : null}
            {ratingInfo?.comment ? (
              <Text className="text-dark-600 text-sm mb-3 italic">&ldquo;{ratingInfo.comment}&rdquo;</Text>
            ) : null}
            {effectiveAssignment.workshop.phone ? (
              <Button title="Llamar al taller" onPress={handleCallWorkshop} variant="primary" icon="call" full />
            ) : null}
          </Card>
        ) : ['assigned', 'in_progress'].includes(incident.status) ? (
          <Card className="p-4 mb-4 bg-amber-50 border-amber-200">
            <Text className="text-dark-800 text-sm">
              Aún no hay taller asignado visible. Actualizamos cada pocos segundos.
            </Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-primary-600 font-semibold text-sm">Actualizar</Text>
            </Pressable>
          </Card>
        ) : null}

        {incident.ai_confidence != null && (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-1">Análisis automático</Text>
            <Text className="text-dark-600 text-sm">
              Confianza de clasificación: {(Number(incident.ai_confidence) * 100).toFixed(0)}%
            </Text>
            {incident.ai_transcription ? (
              <Text className="text-dark-700 text-sm mt-2 leading-5">
                Transcripción de audio: {incident.ai_transcription}
              </Text>
            ) : null}
          </Card>
        )}

        {history.length > 0 ? (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-3">Historial de estados</Text>
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
                {h.notes ? <Text className="text-dark-600 text-xs mt-1">{h.notes}</Text> : null}
              </View>
            ))}
          </Card>
        ) : null}

        {incident.status === 'in_progress' ? (
          <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
            <View className="flex-row items-center">
              <Ionicons name="construct-outline" size={24} color="#2563eb" />
              <Text className="text-dark-900 font-semibold ml-3 flex-1">
                El taller está atendiendo tu vehículo
              </Text>
            </View>
          </Card>
        ) : null}

        {incident.status === 'completed' ? (
          <Card className="p-4 mb-4 bg-green-50 border-green-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text className="text-dark-900 font-bold text-lg ml-3">Completado</Text>
            </View>
            <Text className="text-dark-600 text-sm">
              El servicio fue cerrado. Si aplica, puedes pagar desde la app.
            </Text>
          </Card>
        ) : null}

        {incident.status === 'cancelled' ? (
          <Card className="p-4 mb-4 bg-red-50 border-red-200">
            <View className="flex-row items-center">
              <Ionicons name="close-circle" size={32} color={COLORS.primary} />
              <Text className="text-dark-900 font-bold text-lg ml-3">Cancelado</Text>
            </View>
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

        {showRate ? (
          <Button
            title="Calificar servicio"
            onPress={handleRate}
            variant="primary"
            size="lg"
            icon="star"
            full
            className="mb-4"
          />
        ) : null}

        {canCancel ? (
          <Button
            title="Cancelar solicitud"
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
