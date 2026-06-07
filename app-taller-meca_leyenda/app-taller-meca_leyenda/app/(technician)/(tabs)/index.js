import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { technicianApi } from '../../../src/technician/api/technician.api';
import Loading from '../../../src/components/ui/Loading';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { normalizeListResponse } from '../../../src/utils/apiList';
import { getAssignmentStatusLabel } from '../../../src/utils/format';

export default function TechnicianHomeScreen() {
  const [filter, setFilter] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['technician-assignments', filter],
    queryFn: async () => {
      const { data: raw } = await technicianApi.listAssignments({ status: filter });
      return normalizeListResponse(raw);
    },
  });

  const rows = Array.isArray(data) ? data : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filters = [
    { value: 'active', label: 'Activas' },
    { value: 'completed', label: 'Historial' },
  ];

  const openOrder = (assignmentId) => {
    const id = assignmentId != null && assignmentId !== '' ? String(assignmentId).trim() : '';
    if (!id || id === 'undefined' || id === 'NaN') return;
    // Href con id en la ruta (evita fallos de router.push con pathname '[id]' + params en algunas versiones).
    router.push(`/(technician)/assignment/${id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-4 py-3 bg-white border-b border-dark-100">
        <Text className="text-dark-900 font-bold text-xl mb-3">Órdenes asignadas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {filters.map((f) => (
              <Button
                key={f.value}
                title={f.label}
                onPress={() => setFilter(f.value)}
                variant={filter === f.value ? 'primary' : 'ghost'}
                size="sm"
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d9e75']} />
        }
      >
        {isLoading ? (
          <Loading message="Cargando órdenes..." />
        ) : rows.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="clipboard-outline" size={56} color="#cbd5e1" />
            <Text className="text-dark-600 text-center mt-4">
              {filter === 'active'
                ? 'No tienes servicios activos. Las nuevas asignaciones aparecerán cuando el taller te designe.'
                : 'Sin servicios completados aún.'}
            </Text>
          </View>
        ) : (
          rows.map((row) => (
            <Card
              key={row.id}
              className="p-4 mb-3 active:opacity-90"
              onPress={() => openOrder(row.id)}
              activeOpacity={0.85}
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-dark-900 font-bold text-base flex-1 pr-2">
                  Incidente #{row.incident_id}
                </Text>
                <Text className="text-emerald-700 text-xs font-semibold">
                  {getAssignmentStatusLabel(row.status)}
                </Text>
              </View>
              <Text className="text-dark-600 text-sm mb-1">{row.workshop_name}</Text>
              {row.vehicle_label ? (
                <Text className="text-dark-700 text-sm mb-1">{row.vehicle_label}</Text>
              ) : null}
              {row.address_text ? (
                <Text className="text-dark-500 text-xs" numberOfLines={2}>
                  {row.address_text}
                </Text>
              ) : null}
              <View className="flex-row items-center mt-3">
                <Ionicons name="map" size={18} color="#1d9e75" />
                <Text className="text-primary-600 text-sm font-semibold ml-1">
                  Ver ruta y detalle →
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
