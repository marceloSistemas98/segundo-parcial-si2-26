import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, Image, Text } from 'react-native';
import { useAuthStore } from '../src/store/auth.store';
import Loading from '../src/components/ui/Loading';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-dark-900 items-center justify-center">
        <Image
          source={require('../assets/icon.png')}
          style={{ width: 120, height: 120, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text className="text-white text-xl font-bold mb-4">
          Mecanica la leyenda
        </Text>
        <Loading message="Cargando..." fullScreen={false} />
      </View>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'technician') {
      return <Redirect href="/(technician)" />;
    }
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
