import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import OsmLeafletMap from '../../../src/components/map/OsmLeafletMap';
import NearbyWorkshopsModal from '../../../src/components/workshop/NearbyWorkshopsModal';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Loading from '../../../src/components/ui/Loading';
import AppScreen from '../../../src/components/ui/AppScreen';
import { COLORS, GLASS } from '../../../src/constants/colors';
import { useLocation } from '../../../src/hooks/useLocation';
import { workshopsApi } from '../../../src/api/workshops.api';
import { incidentsApi } from '../../../src/api/incidents.api';
import { useIncidentStore } from '../../../src/store/incident.store';
import { API_BASE_URL } from '../../../src/constants/api';
import { formatDistance } from '../../../src/utils/format';

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function StatChip({ icon, label, value, accent }) {
  return (
    <View
      className="flex-1 flex-row items-center rounded-2xl border border-primary-100 px-3 py-2.5"
      style={{ backgroundColor: GLASS.background }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mr-2.5"
        style={{ backgroundColor: accent ? 'rgba(37,99,235,0.12)' : 'rgba(248,250,252,0.9)' }}
      >
        <Ionicons name={icon} size={18} color={accent ? COLORS.primary : COLORS.textLight} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-dark-500 text-[10px] font-semibold uppercase tracking-wide">{label}</Text>
        <Text className="text-dark-900 font-bold text-sm" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MapLegend() {
  return (
    <View
      className="rounded-2xl border border-primary-100 px-3 py-2"
      style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
    >
      <View className="flex-row items-center mb-1.5">
        <View
          className="w-3 h-3 rounded-full mr-2 border-2 border-white"
          style={{ backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 3 }}
        />
        <Text className="text-dark-700 text-xs font-medium">Tu ubicación</Text>
      </View>
      <View className="flex-row items-center">
        <View
          className="w-5 h-5 rounded-md mr-2 items-center justify-center border border-white"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Ionicons name="build" size={10} color="#fff" />
        </View>
        <Text className="text-dark-700 text-xs font-medium">Taller verificado</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { location, loading: loadingLocation, error: locationError } = useLocation();
  const [workshopsModalOpen, setWorkshopsModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const activeIncident = useIncidentStore((state) => state.activeIncident);

  const {
    data: workshops = [],
    refetch: refetchWorkshops,
    isFetching: fetchingWorkshops,
  } = useQuery({
    queryKey: ['nearby-workshops', location?.latitude, location?.longitude],
    queryFn: async () => {
      if (!location) return [];
      const { data } = await workshopsApi.getNearby(location.latitude, location.longitude, 20);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!location,
    select: (rows) => {
      return rows
        .map((w) => {
          const distanceKm = toFiniteNumber(w.distance_km ?? w.distance);
          const lat = toFiniteNumber(w.latitude);
          const lng = toFiniteNumber(w.longitude);
          return {
            ...w,
            latitude: lat ?? w.latitude,
            longitude: lng ?? w.longitude,
            distance_km: distanceKm,
            rating_avg: toFiniteNumber(w.rating_avg),
            services: Array.isArray(w.services) ? w.services : [],
          };
        })
        .filter((w) => w.latitude != null && w.longitude != null)
        .sort((a, b) => {
          const da = a.distance_km ?? Number.POSITIVE_INFINITY;
          const db = b.distance_km ?? Number.POSITIVE_INFINITY;
          return da - db;
        });
    },
  });

  const { data: activeIncidents } = useQuery({
    queryKey: ['active-incidents'],
    queryFn: async () => {
      const { data } = await incidentsApi.getAll({ status: 'in_progress,assigned,waiting_workshop' });
      return data.results || [];
    },
  });

  useEffect(() => {
    if (activeIncidents && activeIncidents.length > 0) {
      useIncidentStore.getState().setActiveIncident(activeIncidents[0]);
    } else if (activeIncidents && activeIncidents.length === 0) {
      useIncidentStore.getState().setActiveIncident(null);
    }
  }, [activeIncidents]);

  const nearestWorkshop = workshops[0] ?? null;

  const openWorkshopsModal = (workshop = null) => {
    setSelectedWorkshop(workshop);
    setWorkshopsModalOpen(true);
  };

  const closeWorkshopsModal = () => {
    setWorkshopsModalOpen(false);
    setSelectedWorkshop(null);
  };

  const handleReportEmergency = () => {
    if (!location) {
      Alert.alert(
        'Error',
        'No se pudo obtener tu ubicación. Por favor, activa el GPS.',
        [{ text: 'OK' }]
      );
      return;
    }

    useIncidentStore.getState().setDraft({
      draftLatitude: location.latitude,
      draftLongitude: location.longitude,
    });

    router.push('/emergency');
  };

  const handleSearchWorkshops = async () => {
    if (!location) {
      Alert.alert('Ubicación', 'Activa el GPS para buscar talleres cerca de ti.');
      return;
    }
    openWorkshopsModal(null);
    const result = await refetchWorkshops();
    const list = result.data ?? workshops;
    if (!list.length) {
      Toast.show({
        type: 'info',
        text1: 'Sin talleres cercanos',
        text2: 'No hay talleres verificados en tu zona por ahora.',
      });
      return;
    }
    Toast.show({
      type: 'success',
      text1: 'Talleres encontrados',
      text2: `${list.length} taller(es) cerca de ti.`,
    });
  };

  if (loadingLocation) {
    return <Loading fullScreen message="Obteniendo ubicación..." />;
  }

  if (locationError || !location) {
    return (
      <AppScreen className="items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center mb-4">
          <Ionicons name="location-outline" size={40} color={COLORS.primary} />
        </View>
        <Text className="text-dark-900 font-bold text-xl text-center">
          No se pudo obtener tu ubicación
        </Text>
        <Text className="text-dark-600 text-base mt-2 text-center leading-6">
          {locationError || 'Activa el GPS y concede permisos a la app'}
        </Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen orbs={false}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 min-w-0 pr-3">
            <Text className="text-primary-600 font-semibold text-xs uppercase tracking-widest">
              Mecanic La Leyenda
            </Text>
            <Text className="text-dark-900 font-bold text-2xl tracking-tight mt-0.5">
              Asistencia cerca
            </Text>
            <Text className="text-dark-500 text-sm mt-1 leading-5">
              Talleres verificados en un radio de 20 km
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: COLORS.primary,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </View>
        </View>

        <View className="flex-row gap-2 mt-3">
          <StatChip
            icon="construct-outline"
            label="Talleres"
            value={workshops.length ? `${workshops.length} cerca` : 'Buscando…'}
            accent
          />
          <StatChip
            icon="navigate-outline"
            label="Más cercano"
            value={
              nearestWorkshop?.distance_km != null
                ? formatDistance(nearestWorkshop.distance_km)
                : '—'
            }
          />
        </View>
      </View>

      {/* Incidente activo */}
      {activeIncident && (
        <Pressable
          onPress={() => router.push(`/emergency/status/${activeIncident.id}`)}
          className="mx-4 mb-3 rounded-2xl overflow-hidden active:opacity-90"
        >
          <View
            className="flex-row items-center px-4 py-3 border border-amber-200"
            style={{ backgroundColor: 'rgba(255, 251, 235, 0.95)' }}
          >
            <View className="w-11 h-11 rounded-2xl bg-amber-500 items-center justify-center mr-3">
              <Ionicons name="pulse" size={22} color="#fff" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-amber-900 font-bold text-sm">Emergencia en curso</Text>
              <Text className="text-amber-800/80 text-xs mt-0.5">Toca para ver estado y seguimiento</Text>
            </View>
            <Ionicons name="chevron-forward-circle" size={26} color="#d97706" />
          </View>
        </Pressable>
      )}

      {/* Mapa */}
      <View
        className="flex-1 mx-4 mb-3 rounded-3xl overflow-hidden border border-primary-200/70"
        style={{
          shadowColor: '#2563eb',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 5,
        }}
      >
        <OsmLeafletMap
          style={{ flex: 1 }}
          userLocation={location}
          latitudeDelta={0.05}
          circleRadiusMeters={20000}
          workshops={workshops}
          onWorkshopPress={(id) => {
            const ws = workshops.find((w) => w.id === id);
            if (ws) openWorkshopsModal(ws);
          }}
        />

        <View className="absolute top-3 left-3" pointerEvents="none">
          <MapLegend />
        </View>

        <Pressable
          onPress={handleSearchWorkshops}
          disabled={fetchingWorkshops}
          className="absolute bottom-3 right-3 flex-row items-center rounded-2xl px-3.5 py-2.5 border border-primary-200 active:opacity-85"
          style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {fetchingWorkshops ? (
            <Ionicons name="sync" size={18} color={COLORS.primary} />
          ) : (
            <Ionicons name="list-outline" size={18} color={COLORS.primary} />
          )}
          <Text className="text-primary-700 font-bold text-sm ml-2">
            {fetchingWorkshops ? 'Buscando…' : `Ver ${workshops.length || ''} talleres`.trim()}
          </Text>
        </Pressable>
      </View>

      {/* Acciones */}
      <View className="px-4 pb-4">
        <Card className="p-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-3">
              <Ionicons name="warning" size={22} color="#dc2626" />
            </View>
            <View className="flex-1">
              <Text className="text-dark-900 font-bold text-base">¿Necesitas ayuda ahora?</Text>
              <Text className="text-dark-500 text-xs mt-0.5">
                Reporta tu emergencia y te conectamos con un taller
              </Text>
            </View>
          </View>

          <Button
            title="Reportar emergencia"
            onPress={handleReportEmergency}
            variant="primary"
            size="lg"
            full
            icon="flash-outline"
            className="mb-2"
          />

          <Pressable
            onPress={handleSearchWorkshops}
            disabled={fetchingWorkshops}
            className="flex-row items-center justify-center py-3 rounded-xl active:bg-primary-50"
          >
            <Ionicons name="map-outline" size={18} color={COLORS.primary} />
            <Text className="text-primary-600 font-semibold text-sm ml-2">
              Explorar talleres en el mapa
            </Text>
          </Pressable>
        </Card>
      </View>

      <NearbyWorkshopsModal
        visible={workshopsModalOpen}
        onClose={closeWorkshopsModal}
        workshops={workshops}
        loading={fetchingWorkshops}
        selectedWorkshop={selectedWorkshop}
        onSelectWorkshop={setSelectedWorkshop}
        onClearSelection={() => setSelectedWorkshop(null)}
        resolveLogoUri={mediaUrl}
      />
    </AppScreen>
  );
}
