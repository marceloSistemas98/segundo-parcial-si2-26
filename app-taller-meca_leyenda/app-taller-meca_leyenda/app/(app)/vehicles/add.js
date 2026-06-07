import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import AppScreen from '../../../src/components/ui/AppScreen';
import PageHeader from '../../../src/components/ui/PageHeader';
import { COLORS, GLASS } from '../../../src/constants/colors';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { pickImageFromLibrary, takeImageFromCamera } from '../../../src/utils/imagePicker';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { vehiclesApi } from '../../../src/api/vehicles.api';
import { formatApiError } from '../../../src/utils/apiErrors';

const VEHICLE_TYPES = [
  { value: 'car', label: 'Auto' },
  { value: 'motorcycle', label: 'Motocicleta' },
  { value: 'truck', label: 'Camión' },
  { value: 'van', label: 'Camioneta' },
  { value: 'bus', label: 'Bus' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

function emptyVehicleForm() {
  return {
    brand: '',
    model: '',
    year: CURRENT_YEAR.toString(),
    plate: '',
    color: '',
    vehicle_type: 'car',
    vin: '',
    photoUri: null,
  };
}

function extFromUri(uri) {
  const base = (uri || '').split('/').pop() || '';
  return base.split('?')[0].split('.').pop() || 'jpg';
}

function imageMime(ext) {
  const e = (ext || '').toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  return `image/${e || 'jpeg'}`;
}

export default function AddVehicleScreen() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyVehicleForm);

  useFocusEffect(
    useCallback(() => {
      setFormData(emptyVehicleForm());
    }, [])
  );

  const createMutation = useMutation({
    mutationFn: (data) => vehiclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setFormData(emptyVehicleForm());
      Toast.show({
        type: 'success',
        text1: 'Vehículo agregado',
        text2: 'Tu vehículo ha sido registrado correctamente',
      });
      router.back();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatApiError(error.response?.data) || 'Error al registrar el vehículo',
      });
    },
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { brand, model, year, plate, color } = formData;

    if (!brand || !model || !year || !plate || !color) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor completa todos los campos obligatorios',
      });
      return false;
    }

    if (plate.length < 5) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La placa debe tener al menos 5 caracteres',
      });
      return false;
    }

    return true;
  };

  const pickVehiclePhoto = async () => {
    const result = await pickImageFromLibrary({
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.permissionDenied) {
      Toast.show({
        type: 'error',
        text1: 'Permiso',
        text2: 'Necesitamos acceso a la galería para la foto del vehículo',
      });
      return;
    }
    if (!result.canceled && result.assets?.[0]) {
      updateField('photoUri', result.assets[0].uri);
    }
  };

  const takeVehiclePhoto = async () => {
    const result = await takeImageFromCamera({
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.permissionDenied) {
      Toast.show({
        type: 'error',
        text1: 'Permiso',
        text2: 'Necesitamos la cámara para tomar la foto',
      });
      return;
    }
    if (!result.canceled && result.assets?.[0]) {
      updateField('photoUri', result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const fd = new FormData();
    fd.append('brand', formData.brand.trim());
    fd.append('model', formData.model.trim());
    fd.append('year', String(formData.year));
    fd.append('plate', formData.plate.trim().toUpperCase());
    fd.append('color', formData.color.trim());
    fd.append('vehicle_type', formData.vehicle_type);
    if (formData.vin?.trim()) {
      fd.append('vin', formData.vin.trim().toUpperCase());
    }
    if (formData.photoUri) {
      const ext = extFromUri(formData.photoUri);
      fd.append('photo', {
        uri: formData.photoUri,
        name: `vehicle.${ext}`,
        type: imageMime(ext),
      });
    }

    createMutation.mutate(fd);
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Button
              title="← Cancelar"
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
            />
          </View>

          <PageHeader
            title="Agregar vehículo"
            subtitle="Registra tu vehículo para poder reportar emergencias"
            className="px-0 pt-0"
          />

          <Text className="text-dark-700 font-semibold mb-2 text-sm">
            Foto del vehículo (opcional)
          </Text>
          <Pressable
            onPress={pickVehiclePhoto}
            className="mb-2 rounded-2xl border-2 border-dashed border-primary-200 overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
          >
            {formData.photoUri ? (
              <View>
                <Image
                  source={{ uri: formData.photoUri }}
                  className="w-full h-44"
                  resizeMode="cover"
                />
                <View
                  className="flex-row justify-center gap-2 py-2 border-t border-primary-100"
                  style={{ backgroundColor: GLASS.background }}
                >
                  <Button title="Cambiar foto" onPress={pickVehiclePhoto} variant="ghost" size="sm" />
                  <Button
                    title="Quitar"
                    onPress={() => updateField('photoUri', null)}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              </View>
            ) : (
              <View className="py-10 px-4 items-center">
                <Ionicons name="image-outline" size={40} color="#94a3b8" />
                <Text className="text-dark-600 text-sm mt-2 text-center">
                  Toca para elegir desde galería
                </Text>
              </View>
            )}
          </Pressable>
          <View className="flex-row gap-2 mb-6">
            <Button
              title="Galería"
              onPress={pickVehiclePhoto}
              variant="outline"
              size="sm"
              icon="images"
              className="flex-1"
            />
            <Button
              title="Cámara"
              onPress={takeVehiclePhoto}
              variant="outline"
              size="sm"
              icon="camera"
              className="flex-1"
            />
          </View>

          {/* Tipo de vehículo */}
          <Text className="text-dark-700 font-semibold mb-2 text-sm">
            Tipo de vehículo *
          </Text>
          <View className="bg-dark-50 rounded-xl border border-dark-200 mb-4">
            <Picker
              selectedValue={formData.vehicle_type}
              onValueChange={(value) => updateField('vehicle_type', value)}
              style={{ height: 50 }}
            >
              {VEHICLE_TYPES.map((type) => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>

          {/* Marca */}
          <Input
            label="Marca *"
            value={formData.brand}
            onChangeText={(value) => updateField('brand', value)}
            placeholder="Ej: Toyota, Honda, Nissan"
            leftIcon="car"
          />

          {/* Modelo */}
          <Input
            label="Modelo *"
            value={formData.model}
            onChangeText={(value) => updateField('model', value)}
            placeholder="Ej: Corolla, Civic, Sentra"
            leftIcon="car-sport"
          />

          {/* Año */}
          <Text className="text-dark-700 font-semibold mb-2 text-sm">
            Año *
          </Text>
          <View className="bg-dark-50 rounded-xl border border-dark-200 mb-4">
            <Picker
              selectedValue={formData.year}
              onValueChange={(value) => updateField('year', value)}
              style={{ height: 50 }}
            >
              {YEARS.map((year) => (
                <Picker.Item key={year} label={year.toString()} value={year.toString()} />
              ))}
            </Picker>
          </View>

          {/* Placa */}
          <Input
            label="Placa *"
            value={formData.plate}
            onChangeText={(value) => updateField('plate', value.toUpperCase())}
            placeholder="Ej: ABC123"
            leftIcon="clipboard"
            autoCapitalize="characters"
          />

          {/* Color */}
          <Input
            label="Color *"
            value={formData.color}
            onChangeText={(value) => updateField('color', value)}
            placeholder="Ej: Blanco, Negro, Rojo"
            leftIcon="color-palette"
          />

          {/* VIN (opcional) */}
          <Input
            label="VIN (opcional)"
            value={formData.vin}
            onChangeText={(value) => updateField('vin', value.toUpperCase())}
            placeholder="Número de identificación del vehículo"
            leftIcon="barcode"
            autoCapitalize="characters"
          />

          <Text className="text-dark-500 text-xs mb-6">
            * Campos obligatorios
          </Text>

          {/* Botón de envío */}
          <Button
            title="Registrar Vehículo"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            full
            size="lg"
            icon="checkmark-circle"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
