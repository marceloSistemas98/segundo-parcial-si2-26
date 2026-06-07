import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import AppScreen from '../../../src/components/ui/AppScreen';
import PageHeader from '../../../src/components/ui/PageHeader';
import { authApi } from '../../../src/api/auth.api';
import { useAuthStore } from '../../../src/store/auth.store';
import { formatApiError } from '../../../src/utils/apiErrors';

export default function ProfileEditScreen() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergency_contact_name, setEmergencyName] = useState('');
  const [emergency_contact_phone, setEmergencyPhone] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPhone(user.phone || '');
    const cp = user.client_profile;
    setAddress(cp?.address || '');
    setEmergencyName(cp?.emergency_contact_name || '');
    setEmergencyPhone(cp?.emergency_contact_phone || '');
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: (payload) => authApi.updateProfile(payload),
    onSuccess: (response) => {
      updateUser(response.data);
      Toast.show({
        type: 'success',
        text1: 'Perfil actualizado',
        text2: 'Tus datos se guardaron correctamente',
      });
      router.back();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatApiError(error.response?.data) || 'No se pudo guardar',
      });
    },
  });

  const handleSave = () => {
    if (!first_name?.trim() || !last_name?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Datos incompletos',
        text2: 'Nombre y apellido son obligatorios',
      });
      return;
    }
    saveMutation.mutate({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      emergency_contact_name: emergency_contact_name.trim(),
      emergency_contact_phone: emergency_contact_phone.trim(),
    });
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <PageHeader
            title="Editar perfil"
            subtitle="Actualiza tus datos de contacto y la información de emergencia."
          />

          <Input label="Nombre *" value={first_name} onChangeText={setFirstName} placeholder="Tu nombre" />
          <Input label="Apellido *" value={last_name} onChangeText={setLastName} placeholder="Tu apellido" />
          <Input
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            placeholder="Ej: 70000000"
            keyboardType="phone-pad"
          />
          <Input label="Correo" value={user?.email || ''} editable={false} placeholder="—" />
          <Text className="text-dark-500 text-xs -mt-2 mb-4">
            El correo no se puede cambiar desde la app.
          </Text>

          <Text className="text-dark-900 font-semibold text-sm mb-2 mt-2">
            Dirección y contacto de emergencia
          </Text>
          <Input
            label="Dirección"
            value={address}
            onChangeText={setAddress}
            placeholder="Ciudad, zona, referencia..."
            multiline
            numberOfLines={3}
          />
          <Input
            label="Contacto de emergencia (nombre)"
            value={emergency_contact_name}
            onChangeText={setEmergencyName}
            placeholder="Nombre de un familiar o contacto"
          />
          <Input
            label="Contacto de emergencia (teléfono)"
            value={emergency_contact_phone}
            onChangeText={setEmergencyPhone}
            placeholder="Teléfono del contacto"
            keyboardType="phone-pad"
          />

          <Button
            title="Guardar cambios"
            onPress={handleSave}
            loading={saveMutation.isPending}
            full
            size="lg"
            icon="checkmark-circle-outline"
            className="mt-4"
          />
          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="ghost"
            full
            size="md"
            className="mt-2"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
