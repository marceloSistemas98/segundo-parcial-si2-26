import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import OpenStreetRouteMapView from '../maps/OpenStreetRouteMapView';
import { useIncidentTrackingSocket } from '../../realtime/useIncidentTrackingSocket';
import { fetchOsrmDrivingRoute, formatRouteSummary, straightLineRoute } from '../../utils/osrmRoute';
import { getAssignmentStatusLabel } from '../../utils/format';
import { parseLatLng } from '../../utils/geo';
import Card from '../ui/Card';

const ASSIGNMENT_LIVE = ['accepted', 'in_route', 'arrived', 'in_service'];

/** Incidencia en curso con taller; el mapa aplica cuando el assignment ya está aceptado o en ruta. */
const INCIDENT_TRACKING_STATUSES = ['assigned', 'in_progress'];

/**
 * Unifica technician anidado (detalle API) con technician_name del listado/incident serializer.
 */
function assignmentForTracking(assignment) {
  if (!assignment) return null;
  if (assignment.technician && typeof assignment.technician === 'object') {
    return assignment;
  }
  const name = assignment.technician_name?.trim();
  if (!name) return assignment;
  return {
    ...assignment,
    technician: {
      name,
      current_latitude: null,
      current_longitude: null,
    },
  };
}

/**
 * Mapa en vivo + ruta OSRM para el cliente.
 * WebSocket + invalidación del assignment al recibir punto (sincroniza con la query del padre).
 */
export default function ClientLiveTrackingBlock({
  incidentId,
  incidentStatus,
  incidentLat,
  incidentLng,
  assignment: assignmentProp,
}) {
  const [liveLoc, setLiveLoc] = useState(null);
  const queryClient = useQueryClient();
  const assignment = useMemo(() => assignmentForTracking(assignmentProp), [assignmentProp]);

  const { lat, lng } = parseLatLng(incidentLat, incidentLng);

  const socketEnabled =
    !!incidentId &&
    !!assignment &&
    INCIDENT_TRACKING_STATUSES.includes(incidentStatus) &&
    ASSIGNMENT_LIVE.includes(assignment.status);

  const onTechnicianLocation = useCallback(
    (loc) => {
      setLiveLoc(loc);
      queryClient.invalidateQueries({ queryKey: ['incident-assignment', incidentId] });
    },
    [queryClient, incidentId]
  );

  const onTrackingSocketReady = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['incident-assignment', incidentId] });
  }, [queryClient, incidentId]);

  useIncidentTrackingSocket({
    incidentId,
    mode: 'listen',
    enabled: socketEnabled,
    onTechnicianLocation,
    onConnected: onTrackingSocketReady,
  });

  const polledTech = parseLatLng(
    assignment?.technician?.current_latitude,
    assignment?.technician?.current_longitude
  );
  const liveParsed = parseLatLng(liveLoc?.latitude, liveLoc?.longitude);

  useEffect(() => {
    if (!socketEnabled) setLiveLoc(null);
  }, [incidentId, socketEnabled]);

  const techLat = liveParsed.lat ?? polledTech.lat;
  const techLng = liveParsed.lng ?? polledTech.lng;

  const osrmKey = useMemo(() => {
    if (lat == null || lng == null || techLat == null || techLng == null) return null;
    const q = (x) => Math.round(Number(x) * 400) / 400;
    return [q(techLat), q(techLng), q(lat), q(lng)].join('|');
  }, [techLat, techLng, lat, lng]);

  const { data: routeData, isFetching } = useQuery({
    queryKey: ['osrm-route-client', osrmKey],
    queryFn: () => fetchOsrmDrivingRoute(techLat, techLng, lat, lng),
    enabled: osrmKey != null,
    staleTime: 30_000,
  });

  const fromOsrm = routeData?.coordinates ?? null;
  const lineFb =
    techLat != null && techLng != null && lat != null && lng != null
      ? straightLineRoute(techLat, techLng, lat, lng)
      : null;
  const routeCoords = fromOsrm && fromOsrm.length > 1 ? fromOsrm : lineFb;
  const routeSummary = formatRouteSummary(routeData?.distanceM, routeData?.durationS);
  const techName = assignment?.technician?.name?.trim() || 'Tu técnico';

  if (
    lat == null ||
    lng == null ||
    !assignment ||
    !INCIDENT_TRACKING_STATUSES.includes(incidentStatus) ||
    !ASSIGNMENT_LIVE.includes(assignment.status)
  ) {
    return null;
  }

  const liveLine =
    assignment.status === 'in_route'
      ? 'El técnico va hacia ti. Posición en vivo (~cada 10 s) por WebSocket y reflejo en el mapa.'
      : assignment.status === 'accepted'
        ? 'Cuando el técnico marque “en camino”, verás su ruta y posición en tiempo real.'
        : assignment.status === 'arrived'
          ? 'El técnico indicó que ya llegó a tu ubicación.'
          : 'Servicio en curso en el lugar.';

  const liveHint =
    techLat != null && techLng != null
      ? `Última posición: ${Number(techLat).toFixed(5)}, ${Number(techLng).toFixed(5)}`
      : 'Esperando posición del técnico…';

  return (
    <Card className="p-0 mb-4 overflow-hidden border border-emerald-100 bg-white">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-2">
          <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
            <Ionicons name="navigate" size={22} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-dark-900 font-bold text-base">Seguimiento en vivo</Text>
            <Text className="text-dark-700 text-xs mt-0.5 font-medium">{techName}</Text>
            <Text className="text-emerald-800 text-xs font-semibold mt-0.5">
              {getAssignmentStatusLabel(assignment.status)}
            </Text>
          </View>
        </View>
        {isFetching ? <ActivityIndicator size="small" color="#059669" /> : null}
      </View>
      <Text className="text-dark-600 text-sm px-4 mb-2 leading-5">{liveLine}</Text>
      <Text className="text-dark-500 text-[11px] px-4 mb-2 font-mono">{liveHint}</Text>
      {routeSummary ? (
        <View className="flex-row items-center px-4 mb-2">
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text className="text-dark-700 text-sm ml-1 font-medium">{routeSummary} por ruta</Text>
        </View>
      ) : techLat != null && lineFb ? (
        <Text className="text-dark-500 text-xs px-4 mb-2">
          Ruta aproximada en línea recta hasta obtener el trazado por calles.
        </Text>
      ) : null}
      <OpenStreetRouteMapView
        destinationLat={lat}
        destinationLng={lng}
        originLat={techLat}
        originLng={techLng}
        routeCoordinates={routeCoords}
        height={280}
        destinationTitle="Tu ubicación (reporte)"
        originTitle={techName}
      />
      <Text className="text-dark-400 text-[11px] px-4 py-3 bg-slate-50 leading-4">
        Rojo: tu reporte ({lat.toFixed(5)}, {lng.toFixed(5)}). Verde: técnico
        {techLat != null && techLng != null
          ? ` (${Number(techLat).toFixed(5)}, ${Number(techLng).toFixed(5)}).`
          : ' (sin posición aún).'}
        Con &quot;En camino&quot;, el técnico envía GPS ~cada 10 s. Toca los pins para coordenadas
        exactas. Si no ves teselas, revisa datos/Wi‑Fi.
      </Text>
    </Card>
  );
}
