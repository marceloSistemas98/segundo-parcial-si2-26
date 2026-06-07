import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import OsmLocationPickerModal from '../../../src/components/map/OsmLocationPickerModal';
import AppScreen from '../../../src/components/ui/AppScreen';
import { COLORS, GLASS } from '../../../src/constants/colors';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Loading from '../../../src/components/ui/Loading';
import { vehiclesApi } from '../../../src/api/vehicles.api';
import { incidentsApi } from '../../../src/api/incidents.api';
import { useIncidentStore } from '../../../src/store/incident.store';
import { useLocation } from '../../../src/hooks/useLocation';
import { formatApiError } from '../../../src/utils/apiErrors';
import * as Location from 'expo-location';
import { useNetworkStatus } from '../../../src/hooks/useNetworkStatus';
import { enqueueIncidentCreate } from '../../../src/offline/queue';
import { toLocalIncidentId } from '../../../src/utils/incidentRoute';

function roundCoord(n) {
  return Math.round(Number(n) * 1e7) / 1e7;
}

const STEPS = [
  { n: 1, label: 'Ubicación y vehículo' },
  { n: 2, label: 'Evidencias' },
];

function StepProgress({ current = 1 }) {
  return (
    <View className="flex-row items-center mb-4 px-1">
      {STEPS.map((step, i) => {
        const active = step.n === current;
        const done = step.n < current;
        return (
          <React.Fragment key={step.n}>
            <View className="flex-1 items-center min-w-0">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                  active ? 'border-primary-600 bg-primary-600' : done ? 'border-primary-400 bg-primary-100' : 'border-primary-200 bg-white/80'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${active ? 'text-white' : done ? 'text-primary-700' : 'text-dark-400'}`}
                >
                  {step.n}
                </Text>
              </View>
              <Text
                className={`text-[10px] font-semibold mt-1 text-center ${active ? 'text-primary-700' : 'text-dark-400'}`}
                numberOfLines={2}
              >
                {step.label}
              </Text>
            </View>
            {i < STEPS.length - 1 ? (
              <View
                className="h-0.5 flex-1 mx-1 mb-4 rounded-full"
                style={{ backgroundColor: done || active ? COLORS.primary : 'rgba(37,99,235,0.15)' }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <View className="flex-row items-start mb-3">
      <View className="w-9 h-9 rounded-xl bg-primary-50 items-center justify-center mr-2.5 mt-0.5">
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-dark-900 font-bold text-base">{title}</Text>
        {subtitle ? <Text className="text-dark-500 text-xs mt-0.5 leading-4">{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function LocationStatusBadge({ manualLocation, loadingLocation, locationError, location, draftCoords }) {
  if (manualLocation) {
    return (
      <View className="self-start px-2.5 py-1 rounded-full bg-primary-100 border border-primary-200 mb-2">
        <Text className="text-primary-700 text-[10px] font-bold uppercase tracking-wide">Mapa manual</Text>
      </View>
    );
  }
  if (loadingLocation) {
    return (
      <View className="self-start px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 mb-2">
        <Text className="text-dark-500 text-[10px] font-bold uppercase tracking-wide">Obteniendo GPS…</Text>
      </View>
    );
  }
  if (locationError || (!location && !draftCoords)) {
    return (
      <View className="self-start px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 mb-2">
        <Text className="text-amber-800 text-[10px] font-bold uppercase tracking-wide">Sin ubicación</Text>
      </View>
    );
  }
  return (
    <View className="self-start px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-2">
      <Text className="text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
        {location ? 'GPS activo' : 'Desde inicio'}
      </Text>
    </View>
  );
}

function getLocationDescription({ manualLocation, loadingLocation, locationError, location, draftCoords }) {
  if (manualLocation) {
    return `Punto elegido (${manualLocation.latitude.toFixed(5)}, ${manualLocation.longitude.toFixed(5)})`;
  }
  if (loadingLocation) return 'Esperando señal del GPS…';
  if (locationError) return locationError;
  if (location) return `Coordenadas GPS (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`;
  if (draftCoords) return 'Ubicación del mapa de inicio — puedes afinarla abajo';
  return 'Activa el GPS o elige un punto en el mapa';
}

export default function EmergencyStartScreen() {
  const { location, loading: loadingLocation, error: locationError, requestLocation } =
    useLocation(false);

  useFocusEffect(
    useCallback(() => {
      requestLocation();
    }, [requestLocation])
  );
  /** String por compatibilidad con @react-native-picker/picker (Android/iOS). */
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  /** Ubicación elegida manualmente en el mapa OSM (tiene prioridad sobre GPS / borrador del home) */
  const [manualLocation, setManualLocation] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState('');

  const draftLatitude = useIncidentStore((state) => state.draftLatitude);
  const draftLongitude = useIncidentStore((state) => state.draftLongitude);
  const { online } = useNetworkStatus();

  // Obtener vehículos del usuario
  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await vehiclesApi.getAll();
      return data;
    },
  });

  const vehicles = vehiclesData?.results || vehiclesData || [];

  const draftCoords =
    draftLatitude != null && draftLongitude != null
      ? { latitude: draftLatitude, longitude: draftLongitude }
      : null;

  const effectiveLocation =
    manualLocation || location || draftCoords;

  const mapPickerSeed =
    effectiveLocation ||
    draftCoords ||
    location || { latitude: -16.5, longitude: -68.15 };

  useEffect(() => {
    let mounted = true;
    const currentLocation = effectiveLocation;
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      setResolvedAddress('');
      return;
    }

    (async () => {
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
        if (!mounted) return;
        const p = places?.[0];
        if (!p) {
          setResolvedAddress('');
          return;
        }
        const line = [p.street, p.streetNumber].filter(Boolean).join(' ');
        const zone = [p.district, p.city].filter(Boolean).join(', ');
        setResolvedAddress([line, zone].filter(Boolean).join(' · ') || '');
      } catch {
        if (mounted) setResolvedAddress('');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [effectiveLocation]);

  const handleContinue = async () => {
    const vehicleId = parseInt(selectedVehicleId, 10);
    if (!selectedVehicleId || !Number.isFinite(vehicleId)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor selecciona un vehículo',
      });
      return;
    }

    const currentLocation = effectiveLocation;
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Por favor intenta de nuevo.');
      return;
    }

    setLoading(true);

    const payload = {
      vehicle: vehicleId,
      latitude: roundCoord(currentLocation.latitude),
      longitude: roundCoord(currentLocation.longitude),
      description: description || '',
      address_text: resolvedAddress || '',
    };

    useIncidentStore.getState().setDraft({
      draftVehicleId: vehicleId,
      draftLatitude: currentLocation.latitude,
      draftLongitude: currentLocation.longitude,
      draftDescription: description,
    });

    try {
      if (!online) {
        const item = await enqueueIncidentCreate(payload);
        const localRouteId = toLocalIncidentId(item.clientRequestId);
        useIncidentStore.getState().setActiveIncident({
          id: localRouteId,
          localId: item.clientRequestId,
          syncStatus: 'pending',
          offline: true,
          ...payload,
        });
        Toast.show({
          type: 'info',
          text1: 'Guardado sin conexión',
          text2: 'Se enviará automáticamente cuando vuelva internet',
        });
        router.push(`/emergency/evidence/${encodeURIComponent(localRouteId)}`);
        return;
      }

      const { data } = await incidentsApi.create(payload);
      const incidentId = data?.id ?? data?.pk;
      if (incidentId == null) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2:
            'El servidor no devolvió el id del incidente. Revisa la API o vuelve a intentar.',
        });
        return;
      }

      useIncidentStore.getState().setActiveIncident({ ...data, id: incidentId, syncStatus: 'synced' });

      Toast.show({
        type: 'success',
        text1: 'Incidente creado',
        text2: 'Ahora agrega evidencias para ayudarnos',
      });

      router.push(`/emergency/evidence/${incidentId}`);
    } catch (error) {
      const isNetwork =
        !error?.response ||
        error?.code === 'ERR_NETWORK' ||
        (error?.message || '').includes('Network');
      if (isNetwork) {
        try {
          const item = await enqueueIncidentCreate(payload);
          const localRouteId = toLocalIncidentId(item.clientRequestId);
          useIncidentStore.getState().setActiveIncident({
            id: localRouteId,
            localId: item.clientRequestId,
            syncStatus: 'pending',
            offline: true,
            ...payload,
          });
          Toast.show({
            type: 'info',
            text1: 'Sin conexión — guardado localmente',
            text2: 'Sincronizaremos tu emergencia al recuperar la red',
          });
          router.push(`/emergency/evidence/${encodeURIComponent(localRouteId)}`);
          return;
        } catch {
          /* fallthrough */
        }
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatApiError(error.response?.data) || 'Error al crear el incidente',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingVehicles) {
    return <Loading fullScreen message="Cargando vehículos..." />;
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <AppScreen className="px-6 justify-center">
        <View className="items-center">
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(219,234,254,0.9)' }}
          >
            <Ionicons name="car-sport-outline" size={40} color={COLORS.primary} />
          </View>
          <Text className="text-primary-600 font-semibold text-xs uppercase tracking-widest mb-1">
            Paso 1
          </Text>
          <Text className="text-dark-900 font-bold text-2xl text-center mb-3">
            Registra un vehículo
          </Text>
          <Text className="text-dark-600 text-base text-center mb-6 leading-6">
            Necesitas al menos un vehículo para reportar una emergencia y recibir asistencia.
          </Text>
          <Button
            title="Agregar vehículo"
            onPress={() => router.push('/vehicles/add')}
            icon="add-circle-outline"
            full
            size="lg"
          />
        </View>
      </AppScreen>
    );
  }

  const selectedVehicle = vehicles.find((v) => String(v.id) === selectedVehicleId);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-primary-600 font-semibold text-xs uppercase tracking-widest">
            Mecanic La Leyenda
          </Text>
          <Text className="text-dark-900 font-bold text-2xl tracking-tight mt-0.5">
            Reportar emergencia
          </Text>
          <Text className="text-dark-500 text-sm mt-1 leading-5">
            Cuéntanos dónde estás y qué vehículo necesita ayuda
          </Text>
        </View>

        <StepProgress current={1} />

        {!online ? (
          <View
            className="flex-row items-center rounded-2xl border border-amber-200 px-3 py-2.5 mb-4"
            style={{ backgroundColor: 'rgba(255, 251, 235, 0.95)' }}
          >
            <Ionicons name="cloud-offline-outline" size={20} color="#d97706" />
            <Text className="text-amber-900 text-xs ml-2 flex-1 leading-4">
              Sin conexión: tu reporte se guardará y se enviará al recuperar internet.
            </Text>
          </View>
        ) : null}

        {/* Ubicación */}
        <Card className="p-4 mb-4">
          <SectionTitle
            icon="location-outline"
            title="Ubicación del incidente"
            subtitle="Confirma dónde necesitas asistencia"
          />

          <LocationStatusBadge
            manualLocation={manualLocation}
            loadingLocation={loadingLocation}
            locationError={locationError}
            location={location}
            draftCoords={draftCoords}
          />

          <Text className="text-dark-700 text-sm leading-5 mb-1">
            {getLocationDescription({
              manualLocation,
              loadingLocation,
              locationError,
              location,
              draftCoords,
            })}
          </Text>

          {resolvedAddress ? (
            <View className="flex-row items-start mt-2 mb-3 rounded-xl px-3 py-2 border border-primary-100" style={{ backgroundColor: 'rgba(239,246,255,0.7)' }}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.primary} style={{ marginTop: 1 }} />
              <Text className="text-dark-600 text-xs ml-2 flex-1 leading-4">{resolvedAddress}</Text>
            </View>
          ) : (
            <View className="mb-3" />
          )}

          <View className="flex-row flex-wrap gap-2">
            <Button
              title="Elegir en mapa"
              onPress={() => {
                if (!mapPickerSeed?.latitude || !mapPickerSeed?.longitude) {
                  Toast.show({
                    type: 'error',
                    text1: 'Sin referencia',
                    text2: 'Activa el GPS o vuelve al inicio para tener una ubicación base',
                  });
                  return;
                }
                setMapPickerOpen(true);
              }}
              variant="primary"
              size="sm"
              icon="map-outline"
              className="flex-1 min-w-[140px]"
            />
            {manualLocation ? (
              <Button
                title="Usar GPS"
                onPress={() => setManualLocation(null)}
                variant="outline"
                size="sm"
                icon="navigate-outline"
                className="flex-1 min-w-[120px]"
              />
            ) : null}
            {!loadingLocation && (locationError || (!location && !draftCoords)) ? (
              <Button
                title="Reintentar GPS"
                onPress={() => requestLocation()}
                variant="outline"
                size="sm"
                icon="refresh-outline"
                className="flex-1 min-w-[120px]"
              />
            ) : null}
          </View>
        </Card>

        <OsmLocationPickerModal
          visible={mapPickerOpen}
          onClose={() => setMapPickerOpen(false)}
          initialLatitude={mapPickerSeed.latitude}
          initialLongitude={mapPickerSeed.longitude}
          onConfirm={(coords) => {
            setManualLocation(coords);
            useIncidentStore.getState().setDraft({
              draftLatitude: coords.latitude,
              draftLongitude: coords.longitude,
            });
            Toast.show({
              type: 'success',
              text1: 'Ubicación actualizada',
              text2: 'Se usará el punto elegido en el mapa',
            });
          }}
        />

        {/* Vehículo */}
        <Card className="p-4 mb-4">
          <SectionTitle
            icon="car-sport-outline"
            title="Tu vehículo"
            subtitle="Selecciona el vehículo afectado"
          />

          <View
            className="rounded-xl border border-primary-200 overflow-hidden mb-3"
            style={{ backgroundColor: GLASS.background }}
          >
            <Picker
              selectedValue={selectedVehicleId}
              onValueChange={(value) => setSelectedVehicleId(value)}
              style={{ height: 52 }}
            >
              <Picker.Item label="— Selecciona un vehículo —" value="" />
              {vehicles.map((vehicle) => (
                <Picker.Item
                  key={vehicle.id}
                  label={`${vehicle.brand} ${vehicle.model} (${vehicle.plate})`}
                  value={String(vehicle.id)}
                />
              ))}
            </Picker>
          </View>

          {selectedVehicle ? (
            <View
              className="flex-row items-center rounded-xl px-3 py-2.5 mb-3 border border-primary-100"
              style={{ backgroundColor: 'rgba(239,246,255,0.75)' }}
            >
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text className="text-dark-700 text-sm ml-2 flex-1">
                {selectedVehicle.brand} {selectedVehicle.model} · {selectedVehicle.plate}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/vehicles/add')}
            className="flex-row items-center justify-center py-2.5 rounded-xl active:bg-primary-50"
          >
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text className="text-primary-600 font-semibold text-sm ml-2">Agregar otro vehículo</Text>
          </Pressable>
        </Card>

        {/* Descripción */}
        <Card className="p-4 mb-4">
          <SectionTitle
            icon="document-text-outline"
            title="Describe el problema"
            subtitle="Opcional — ayuda al taller a prepararse"
          />
          <Input
            label=""
            value={description}
            onChangeText={setDescription}
            placeholder="Ej: el motor no enciende, flat tire, batería descargada…"
            multiline
            numberOfLines={4}
            className="mb-0"
          />
        </Card>

        <View
          className="flex-row items-start rounded-2xl border border-primary-100 px-3 py-3 mb-5"
          style={{ backgroundColor: 'rgba(239,246,255,0.65)' }}
        >
          <Ionicons name="bulb-outline" size={20} color={COLORS.primary} style={{ marginTop: 1 }} />
          <Text className="text-dark-600 text-xs ml-2.5 flex-1 leading-4">
            En el siguiente paso podrás subir fotos y grabar audio para que el taller entienda mejor tu
            situación.
          </Text>
        </View>
      </ScrollView>

      {/* CTA fijo inferior */}
      <View
        className="px-4 pt-3 pb-4 border-t border-primary-100"
        style={{ backgroundColor: GLASS.tabBar }}
      >
        <Button
          title="Continuar a evidencias"
          onPress={handleContinue}
          loading={loading}
          full
          size="lg"
          icon="arrow-forward-circle-outline"
          iconPosition="right"
        />
      </View>
    </AppScreen>
  );
}
