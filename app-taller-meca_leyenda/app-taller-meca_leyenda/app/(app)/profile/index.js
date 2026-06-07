import React, { useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AppScreen from '../../../src/components/ui/AppScreen';
import PageHeader from '../../../src/components/ui/PageHeader';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/store/auth.store';
import { authApi } from '../../../src/api/auth.api';
import { COLORS } from '../../../src/constants/colors';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();

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
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Editar perfil',
      subtitle: 'Nombre, teléfono, dirección y contacto de emergencia',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Cambiar contraseña',
      subtitle: 'Actualiza tu contraseña de acceso',
      onPress: () => router.push('/profile/change-password'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Ayuda',
      subtitle: 'Soporte y preguntas frecuentes',
      onPress: () =>
        Toast.show({
          type: 'info',
          text1: 'Ayuda',
          text2: 'Contacta a soporte por los canales oficiales de tu servicio',
        }),
    },
  ];

  const cp = user?.client_profile;
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || 'Usuario';

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <PageHeader title="Mi perfil" subtitle="Tu cuenta y preferencias" />

        <View className="items-center px-4 pb-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{
              backgroundColor: COLORS.primary,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.28,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text className="text-white text-4xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-dark-900 font-bold text-2xl text-center">{displayName}</Text>
          <Text className="text-dark-600 text-base mt-1">{user?.email}</Text>
          <Text className="text-dark-500 text-sm mt-1">@{user?.username}</Text>
        </View>

        <View className="px-4">
          <Text className="text-dark-700 font-semibold text-sm mb-2 px-1">Resumen de cuenta</Text>
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="call-outline" size={20} color={COLORS.textLight} />
              <Text className="text-dark-700 ml-3 flex-1">{user?.phone || 'Sin teléfono'}</Text>
            </View>
            {(cp?.emergency_contact_name || cp?.emergency_contact_phone) && (
              <View className="pt-3 border-t border-primary-100">
                <Text className="text-dark-500 text-xs font-semibold mb-2">Contacto de emergencia</Text>
                <Text className="text-dark-700 text-sm">
                  {cp.emergency_contact_name || '—'}
                  {cp.emergency_contact_phone ? ` · ${cp.emergency_contact_phone}` : ''}
                </Text>
              </View>
            )}
          </Card>

          <Text className="text-dark-700 font-semibold text-sm mb-2 px-1">Cuenta y seguridad</Text>
          {menuItems.map((item, index) => (
            <Card
              key={index}
              onPress={item.onPress}
              className="p-4 mb-2 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-xl bg-primary-50 items-center justify-center mr-3">
                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-dark-900 font-semibold">{item.title}</Text>
                <Text className="text-dark-500 text-sm">{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </Card>
          ))}

          <Card className="p-4 mt-2 flex-row items-center">
            <Ionicons name="information-circle-outline" size={22} color={COLORS.textLight} />
            <Text className="text-dark-600 text-sm ml-3 flex-1">Versión 1.0.5</Text>
          </Card>

          <Button
            title="Cerrar sesión"
            onPress={handleLogout}
            variant="danger"
            size="lg"
            full
            icon="log-out-outline"
            className="mt-6"
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
