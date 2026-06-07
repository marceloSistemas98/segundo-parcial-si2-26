import React from 'react';
import { View, Text, ScrollView, Alert, Image } from 'react-native';
import AppScreen from '../../../src/components/ui/AppScreen';
import { COLORS } from '../../../src/constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Badge from '../../../src/components/ui/Badge';
import Loading from '../../../src/components/ui/Loading';
import { vehiclesApi } from '../../../src/api/vehicles.api';
import { resolveMediaUrl } from '../../../src/utils/media';

const VEHICLE_TYPE_LABELS = {
  car: 'Auto',
  motorcycle: 'Motocicleta',
  truck: 'Camión',
  van: 'Camioneta',
  bus: 'Bus',
};

export default function VehicleDetailScreen() {
  const { id: routeId } = useLocalSearchParams();
  const vehicleId = Array.isArray(routeId) ? routeId[0] : routeId;
  const queryClient = useQueryClient();

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const { data } = await vehiclesApi.getById(vehicleId);
      return data;
    },
    enabled: !!vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => vehiclesApi.delete(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      Toast.show({
        type: 'success',
        text1: 'Vehículo eliminado',
        text2: 'El vehículo ha sido eliminado correctamente',
      });
      router.back();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.error || 'Error al eliminar el vehículo',
      });
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Vehículo',
      `¿Estás seguro de que deseas eliminar ${vehicle.brand} ${vehicle.model}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando vehículo..." />;
  }

  if (!vehicle) {
    return (
      <AppScreen className="items-center justify-center px-6">
        <Ionicons name="car-outline" size={64} color="#cbd5e1" />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          Vehículo no encontrado
        </Text>
        <Button
          title="Volver"
          onPress={() => router.back()}
          variant="primary"
          size="md"
          className="mt-6"
        />
      </AppScreen>
    );
  }

  const getVehicleIcon = (type) => {
    const icons = {
      car: 'car',
      motorcycle: 'bicycle',
      truck: 'bus',
      van: 'car-sport',
      bus: 'bus',
    };
    return icons[type] || 'car';
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Button
            title="← Volver"
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
        </View>

        {/* Imagen del vehículo */}
        <View className="items-center mb-6">
          {resolveMediaUrl(vehicle.photo) ? (
            <Image
              source={{ uri: resolveMediaUrl(vehicle.photo) }}
              className="w-40 h-40 rounded-3xl bg-dark-100"
              resizeMode="cover"
            />
          ) : (
            <View className="w-32 h-32 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name={getVehicleIcon(vehicle.vehicle_type)} size={64} color={COLORS.primary} />
            </View>
          )}
        </View>

        {/* Información principal */}
        <Text className="text-dark-900 font-bold text-3xl text-center mb-2">
          {vehicle.brand} {vehicle.model}
        </Text>
        <View className="flex-row items-center justify-center mb-6">
          <Badge
            label={vehicle.plate}
            variant="default"
            size="lg"
            icon="clipboard"
            className="mr-2"
          />
          {vehicle.is_active && (
            <Badge
              label="Activo"
              variant="success"
              size="lg"
            />
          )}
        </View>

        {/* Detalles */}
        <Card className="p-4 mb-4">
          <Text className="text-dark-900 font-semibold mb-4 text-lg">
            Detalles del Vehículo
          </Text>

          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="car-sport" size={20} color="#64748b" />
              <Text className="text-dark-600 text-sm ml-2">Tipo</Text>
            </View>
            <Text className="text-dark-900 font-semibold ml-7">
              {VEHICLE_TYPE_LABELS[vehicle.vehicle_type] || vehicle.vehicle_type}
            </Text>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar" size={20} color="#64748b" />
              <Text className="text-dark-600 text-sm ml-2">Año</Text>
            </View>
            <Text className="text-dark-900 font-semibold ml-7">
              {vehicle.year}
            </Text>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="color-palette" size={20} color="#64748b" />
              <Text className="text-dark-600 text-sm ml-2">Color</Text>
            </View>
            <Text className="text-dark-900 font-semibold ml-7">
              {vehicle.color}
            </Text>
          </View>

          {vehicle.vin && (
            <View className="mb-3">
              <View className="flex-row items-center mb-2">
                <Ionicons name="barcode" size={20} color="#64748b" />
                <Text className="text-dark-600 text-sm ml-2">VIN</Text>
              </View>
              <Text className="text-dark-900 font-semibold ml-7">
                {vehicle.vin}
              </Text>
            </View>
          )}

          {vehicle.created_at && (
            <View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="time" size={20} color="#64748b" />
                <Text className="text-dark-600 text-sm ml-2">Registrado</Text>
              </View>
              <Text className="text-dark-900 font-semibold ml-7">
                {new Date(vehicle.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </Card>

        {/* Historial de incidentes */}
        {vehicle.incidents && vehicle.incidents.length > 0 && (
          <Card className="p-4 mb-4">
            <Text className="text-dark-900 font-semibold mb-3 text-lg">
              Historial de Incidentes
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="document-text" size={20} color="#64748b" />
              <Text className="text-dark-700 ml-2">
                {vehicle.incidents.length} incidente(s) registrado(s)
              </Text>
            </View>
          </Card>
        )}

        {/* Acciones */}
        <View className="mt-6">
          <Button
            title="Eliminar Vehículo"
            onPress={handleDelete}
            variant="danger"
            size="lg"
            icon="trash"
            full
            loading={deleteMutation.isPending}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
