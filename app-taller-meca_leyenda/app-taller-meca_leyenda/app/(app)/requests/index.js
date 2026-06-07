import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { incidentsApi } from '../../../src/api/incidents.api';
import IncidentCard from '../../../src/components/incident/IncidentCard';
import Loading from '../../../src/components/ui/Loading';
import AppScreen from '../../../src/components/ui/AppScreen';
import PageHeader from '../../../src/components/ui/PageHeader';
import FilterChips from '../../../src/components/ui/FilterChips';
import { normalizeListResponse } from '../../../src/utils/apiList';
import { COLORS } from '../../../src/constants/colors';

/** Coinciden con IncidentStatus en Django (apps.incidents.models). */
const STATUS_ACTIVE =
  'pending,analyzing,waiting_workshop,assigned,in_progress';

export default function RequestsScreen() {
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incidents', filter],
    queryFn: async () => {
      const statusByFilter = {
        active: STATUS_ACTIVE,
        completed: 'completed',
        cancelled: 'cancelled',
      };
      const params =
        filter !== 'all' && statusByFilter[filter]
          ? { status: statusByFilter[filter] }
          : {};
      const { data } = await incidentsApi.getAll(params);
      return normalizeListResponse(data);
    },
  });

  const incidents = Array.isArray(data) ? data : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filters = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'completed', label: 'Completados' },
    { value: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <AppScreen>
      <PageHeader title="Mis solicitudes" subtitle="Historial y seguimiento de emergencias" />
      <FilterChips options={filters} value={filter} onChange={setFilter} className="mb-3" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {isLoading ? (
          <Loading message="Cargando solicitudes..." />
        ) : incidents.length === 0 ? (
          <View className="items-center justify-center py-12">
            <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center mb-4">
              <Ionicons name="document-text-outline" size={40} color={COLORS.primary} />
            </View>
            <Text className="text-dark-700 font-semibold text-base text-center">
              No tienes solicitudes todavía
            </Text>
            <Text className="text-dark-500 text-sm mt-2 text-center px-6">
              Cuando reportes una emergencia, aparecerá aquí con su estado en tiempo real.
            </Text>
          </View>
        ) : (
          incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onPress={() => router.push(`/requests/${incident.id}`)}
            />
          ))
        )}
      </ScrollView>
    </AppScreen>
  );
}
