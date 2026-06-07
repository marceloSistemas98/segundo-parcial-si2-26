import React, { useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../../src/components/ui/Card';
import Button from '../../../../src/components/ui/Button';
import { useAuthStore } from '../../../../src/store/auth.store';
import { authApi } from '../../../../src/api/auth.api';

export default function TechnicianProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const tp = user?.technician_profile;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      authApi
        .getProfile()
        .then(({ data }) => {
          if (!cancelled) updateUser(data);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [updateUser])
  );

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Salir de la cuenta de técnico?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || 'Técnico';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center py-8 px-4 bg-white border-b border-dark-100">
          <View className="w-24 h-24 rounded-full bg-emerald-600 items-center justify-center mb-4">
            <Ionicons name="construct" size={40} color="#fff" />
          </View>
          <Text className="text-dark-900 font-bold text-2xl text-center">{displayName}</Text>
          <Text className="text-dark-600 text-base mt-1">{user?.email}</Text>
          {tp?.workshop_name ? (
            <Text className="text-emerald-800 font-semibold text-sm mt-2">{tp.workshop_name}</Text>
          ) : null}
        </View>

        <View className="px-4 py-4">
          <Card className="p-4 mb-4">
            <Text className="text-dark-800 font-semibold mb-2">Cuenta técnico</Text>
            <Text className="text-dark-600 text-sm">
              El registro en la app es solo para clientes. Tu usuario lo crea el administrador o el dueño del
              taller y debe vincularse a tu ficha de técnico.
            </Text>
          </Card>

          <Card
            onPress={() => router.push('/(technician)/profile/change-password')}
            className="p-4 mb-2 flex-row items-center active:bg-dark-50"
          >
            <Ionicons name="lock-closed" size={22} color="#1d9e75" />
            <View className="flex-1 ml-3">
              <Text className="text-dark-900 font-semibold">Cambiar contraseña</Text>
              <Text className="text-dark-500 text-sm">Misma pantalla que el cliente</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Card>

          <Button
            title="Cerrar sesión"
            onPress={handleLogout}
            variant="danger"
            size="lg"
            full
            icon="log-out"
            className="mt-6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
