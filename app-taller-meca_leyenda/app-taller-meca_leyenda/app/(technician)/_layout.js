import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import Loading from '../../src/components/ui/Loading';

/**
 * Stack: pestañas (órdenes + perfil) y pantalla de detalle con mapa/ruta.
 * Así `assignment/[id]` se apila encima y el mapa WebView se monta bien (evita bugs con Tabs ocultos).
 */
export default function TechnicianLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'technician') {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="assignment/[id]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
