import '../global.css'; // IMPORTANTE: Importar estilos de NativeWind
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/auth.store';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { STRIPE_PUBLISHABLE_KEY, APP_URL_SCHEME } from '../src/constants/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  usePushNotifications();

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          urlScheme={APP_URL_SCHEME}
          setReturnUrlSchemeOnAndroid={true}
        >
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(technician)" />
            <Stack.Screen
              name="payment/[assignmentId]"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Pagar Servicio',
              }}
            />
            <Stack.Screen
              name="rate/[assignmentId]"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Calificar',
              }}
            />
          </Stack>
          <Toast />
        </StripeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
