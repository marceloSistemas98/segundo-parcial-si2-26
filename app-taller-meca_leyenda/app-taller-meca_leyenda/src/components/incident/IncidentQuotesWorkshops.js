import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { incidentsApi } from '../../api/incidents.api';
import { isLocalIncidentId } from '../../utils/incidentRoute';

const EMPTY_HINT =
  'Debe haber talleres verificados cerca (GPS del incidente), con suscripción activa, técnico disponible y dentro de su radio. Si el tipo de emergencia es motor/batería, el taller debe ofrecer ese servicio o «general» en su perfil.';

export default function IncidentQuotesWorkshops({ incidentId, incidentStatus }) {
  const queryClient = useQueryClient();
  const [selectingId, setSelectingId] = useState(null);
  const enabled = !!incidentId && !isLocalIncidentId(incidentId);
  const canSearch = incidentStatus === 'waiting_workshop';

  const { data: workshops = [], isFetching } = useQuery({
    queryKey: ['offered-workshops', incidentId],
    queryFn: async () => {
      const { data } = await incidentsApi.getOfferedWorkshops(incidentId);
      return Array.isArray(data) ? data : [];
    },
    enabled,
    refetchInterval: canSearch ? 12000 : false,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['incident-quotes', incidentId],
    queryFn: async () => {
      const { data } = await incidentsApi.getQuotes(incidentId);
      return Array.isArray(data) ? data : [];
    },
    enabled,
    refetchInterval: 15000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => incidentsApi.refreshWorkshopOffers(incidentId),
    onSuccess: (res) => {
      const count = res.data?.offered_count ?? 0;
      queryClient.invalidateQueries({ queryKey: ['offered-workshops', incidentId] });
      Toast.show({
        type: count > 0 ? 'success' : 'info',
        text1: count > 0 ? 'Talleres encontrados' : 'Sin talleres por ahora',
        text2:
          count > 0
            ? `${count} taller(es) pueden atender tu solicitud`
            : 'Revisa que haya talleres verificados cerca con técnicos disponibles',
      });
    },
    onError: (e) => {
      const status = e.response?.status;
      const msg =
        e.response?.data?.error ||
        (status === 404
          ? 'Reinicia el servidor backend (falta la ruta refresh-workshop-offers)'
          : 'Intenta de nuevo');
      Toast.show({
        type: 'error',
        text1: 'No se pudo buscar',
        text2: msg,
      });
    },
  });

  const selectMutation = useMutation({
    mutationFn: (assignmentId) => incidentsApi.selectWorkshop(incidentId, assignmentId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Taller seleccionado' });
      queryClient.invalidateQueries({ queryKey: ['offered-workshops', incidentId] });
    },
    onError: (e) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e.response?.data?.error || 'No se pudo seleccionar el taller',
      });
    },
    onSettled: () => setSelectingId(null),
  });

  const respondMutation = useMutation({
    mutationFn: ({ quoteId, action }) => incidentsApi.respondQuote(incidentId, quoteId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-quotes', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });

  if (!enabled) return null;

  return (
    <View className="mb-4">
      {canSearch && workshops.length === 0 ? (
        <Card className="p-4 mb-3 bg-slate-50 border-slate-200">
          <Text className="text-dark-900 font-bold text-base mb-2">Buscando talleres</Text>
          <Text className="text-dark-600 text-xs leading-5 mb-3">{EMPTY_HINT}</Text>
          <Button
            title={isFetching || refreshMutation.isPending ? 'Buscando…' : 'Volver a buscar talleres'}
            variant="outline"
            size="sm"
            loading={refreshMutation.isPending}
            onPress={() => refreshMutation.mutate()}
          />
        </Card>
      ) : null}

      {workshops.length > 0 ? (
        <Card className="p-4 mb-3">
          <Text className="text-dark-900 font-bold text-base mb-2">Elegir taller</Text>
          <Text className="text-dark-600 text-xs mb-3">
            Talleres que pueden atender tu emergencia.
          </Text>
          {workshops.map((w) => (
            <View
              key={w.assignment_id}
              className="border border-dark-100 rounded-lg p-3 mb-2"
            >
              <Text className="text-dark-900 font-semibold">{w.workshop_name}</Text>
              <Text className="text-dark-600 text-xs">
                {w.distance_km ? `${w.distance_km} km` : 'Distancia no disponible'} · ★ {w.rating_avg}
              </Text>
              {w.ai_estimated_price ? (
                <Text className="text-dark-800 text-sm mt-1">
                  Precio estimado IA: Bs. {w.ai_estimated_price}
                </Text>
              ) : null}
              {w.estimated_arrival_minutes != null ? (
                <Text className="text-dark-600 text-xs mt-1">
                  Llegada estimada: {w.estimated_arrival_minutes} min
                </Text>
              ) : null}
              {w.client_selected ? (
                <Text className="text-green-700 text-xs mt-1 font-semibold">Tu selección</Text>
              ) : (
                <Button
                  title="Seleccionar este taller"
                  size="sm"
                  className="mt-2"
                  loading={selectingId === w.assignment_id}
                  onPress={() => {
                    setSelectingId(w.assignment_id);
                    selectMutation.mutate(w.assignment_id);
                  }}
                />
              )}
            </View>
          ))}
        </Card>
      ) : null}

      {quotes.length > 0 ? (
        <Card className="p-4">
          <Text className="text-dark-900 font-bold text-base mb-2">Cotizaciones</Text>
          {quotes.map((q) => (
            <View key={q.id} className="border border-dark-100 rounded-lg p-3 mb-2">
              <Text className="text-dark-900 font-semibold">{q.workshop_name}</Text>
              <Text className="text-dark-700 text-sm">
                Monto: Bs. {q.amount} · Reparación ~{q.estimated_repair_minutes} min
              </Text>
              {q.estimated_arrival_minutes != null ? (
                <Text className="text-dark-600 text-xs">
                  Llegada estimada: {q.estimated_arrival_minutes} min
                </Text>
              ) : null}
              {q.damage_description ? (
                <Text className="text-dark-600 text-xs mt-1">{q.damage_description}</Text>
              ) : null}
              <Text className="text-dark-500 text-xs mt-1 capitalize">Estado: {q.status}</Text>
              {q.status === 'sent' ? (
                <View className="flex-row gap-2 mt-2">
                  <Button
                    title="Aprobar"
                    size="sm"
                    className="flex-1"
                    onPress={() => respondMutation.mutate({ quoteId: q.id, action: 'approve' })}
                  />
                  <Button
                    title="Rechazar"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onPress={() => respondMutation.mutate({ quoteId: q.id, action: 'reject' })}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
