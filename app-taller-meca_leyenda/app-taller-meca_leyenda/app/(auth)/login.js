import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AppScreen from '../../src/components/ui/AppScreen';
import Card from '../../src/components/ui/Card';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/auth.store';
import { COLORS } from '../../src/constants/colors';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor completa todos los campos',
      });
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Bienvenido',
        text2: 'Sesión iniciada correctamente',
      });
      const role = useAuthStore.getState().user?.role;
      router.replace(role === 'technician' ? '/(technician)' : '/(app)/home');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Credenciales incorrectas',
      });
    }
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center py-6">
            {/* Brand */}
            <View className="items-center mb-8">
              <View
                className="rounded-3xl p-3 mb-4 border border-primary-100"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.88)',
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  elevation: 4,
                }}
              >
                <Image
                  source={require('../../assets/logo1.png')}
                  style={{ width: 120, height: 120 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-primary-600 font-semibold text-xs uppercase tracking-widest">
                Mecanic La Leyenda
              </Text>
              <Text className="text-dark-900 font-bold text-3xl tracking-tight mt-1">
                Bienvenido
              </Text>
              <Text className="text-dark-500 text-sm mt-2 text-center leading-5 px-4">
                Inicia sesión para reportar emergencias y seguir tus solicitudes
              </Text>
            </View>

            {/* Formulario */}
            <Card className="p-5 mb-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-xl bg-primary-50 items-center justify-center mr-3">
                  <Ionicons name="log-in-outline" size={22} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-dark-900 font-bold text-base">Iniciar sesión</Text>
                  <Text className="text-dark-500 text-xs mt-0.5">Cliente o técnico de taller</Text>
                </View>
              </View>

              <Input
                label="Usuario o email"
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu usuario o email"
                leftIcon="person-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                leftIcon="lock-closed-outline"
                secureTextEntry
                className="mb-0"
              />
            </Card>

            <Button
              title="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              full
              size="lg"
              icon="arrow-forward-circle-outline"
              iconPosition="right"
            />

            <Pressable
              onPress={() => router.push('/(auth)/register')}
              className="mt-6 items-center py-2 active:opacity-80"
            >
              <Text className="text-dark-600 text-sm text-center">
                ¿Cliente nuevo?{' '}
                <Text className="text-primary-600 font-bold">Crear cuenta</Text>
              </Text>
            </Pressable>

            <View
              className="flex-row items-start rounded-2xl border border-primary-100 px-3 py-3 mt-4"
              style={{ backgroundColor: 'rgba(239,246,255,0.65)' }}
            >
              <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} style={{ marginTop: 1 }} />
              <Text className="text-dark-600 text-xs ml-2 flex-1 leading-4">
                Técnicos de taller: usa las credenciales que te dio el administrador. No hay registro en la app.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
