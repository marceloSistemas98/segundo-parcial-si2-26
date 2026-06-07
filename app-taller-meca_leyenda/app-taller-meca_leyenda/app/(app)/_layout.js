import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import Loading from '../../src/components/ui/Loading';
import OfflineSyncProvider from '../../src/components/offline/OfflineSyncProvider';
import { COLORS, GLASS } from '../../src/constants/colors';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'technician') {
    return <Redirect href="/(technician)" />;
  }

  const tabPadBottom = Math.max(insets.bottom, 8);

  return (
    <OfflineSyncProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            minHeight: 56,
            height: 56 + tabPadBottom,
            paddingBottom: tabPadBottom,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: GLASS.border,
            backgroundColor: GLASS.tabBar,
            elevation: 8,
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="emergency/index"
          options={{
            title: 'Emergencia',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Solicitudes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: 'Vehículos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-sport-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="emergency/evidence/[id]" options={{ href: null }} />
        <Tabs.Screen name="emergency/status/[id]" options={{ href: null }} />
        <Tabs.Screen name="profile/edit" options={{ href: null }} />
        <Tabs.Screen name="profile/change-password" options={{ href: null }} />
      </Tabs>
    </OfflineSyncProvider>
  );
}
