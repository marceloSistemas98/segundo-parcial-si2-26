import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../../src/components/ui/AppScreen';
import Card from '../../src/components/ui/Card';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/auth.store';
import { COLORS } from '../../src/constants/colors';

function SectionTitle({ icon, title, subtitle }) {
  return (
    <View className="flex-row items-start mb-4">
      <View className="w-9 h-9 rounded-xl bg-primary-50 items-center justify-center mr-2.5">
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-dark-900 font-bold text-base">{title}</Text>
        {subtitle ? <Text className="text-dark-500 text-xs mt-0.5 leading-4">{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const register = useAuthStore((state) => state.register);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { first_name, last_name, email, phone, username, password, password_confirm } = formData;

    if (!first_name || !last_name || !email || !phone || !username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor completa todos los campos',
      });
      return false;
    }

    if (password !== password_confirm) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Las contraseñas no coinciden',
      });
      return false;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La contraseña debe tener al menos 6 caracteres',
      });
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      username: formData.username,
      password: formData.password,
      password_confirm: formData.password_confirm,
    };

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Registro exitoso',
        text2: 'Tu cuenta ha sido creada',
      });
      router.replace('/(app)/home');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Error al registrarse',
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-2 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center self-start py-2 pr-3 mb-4 active:opacity-70"
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
              <Text className="text-primary-600 text-sm font-semibold ml-1.5">Volver</Text>
            </Pressable>

            <Text className="text-primary-600 font-semibold text-xs uppercase tracking-widest">
              Mecanic La Leyenda
            </Text>
            <Text className="text-dark-900 font-bold text-2xl tracking-tight mt-0.5">
              Crear cuenta
            </Text>
            <Text className="text-dark-500 text-sm mt-1 leading-5">
              Regístrate como cliente para solicitar asistencia vehicular
            </Text>

            <View
              className="flex-row items-start rounded-2xl border border-amber-200 px-3 py-3 mt-4 mb-5"
              style={{ backgroundColor: 'rgba(255, 251, 235, 0.95)' }}
            >
              <Ionicons name="construct-outline" size={18} color="#d97706" style={{ marginTop: 1 }} />
              <Text className="text-amber-900 text-xs ml-2 flex-1 leading-4">
                ¿Eres técnico de taller? No uses este formulario. Tu cuenta la crea el administrador o el
                dueño del taller — inicia sesión desde la pantalla principal.
              </Text>
            </View>

            <Card className="p-4 mb-4">
              <SectionTitle
                icon="person-outline"
                title="Datos personales"
                subtitle="Nombre y contacto"
              />
              <Input
                label="Nombre"
                value={formData.first_name}
                onChangeText={(value) => updateField('first_name', value)}
                placeholder="Tu nombre"
                leftIcon="person-outline"
              />
              <Input
                label="Apellido"
                value={formData.last_name}
                onChangeText={(value) => updateField('last_name', value)}
                placeholder="Tu apellido"
                leftIcon="person-outline"
              />
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="tu@email.com"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Teléfono"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="+591 XXXXXXXX"
                leftIcon="call-outline"
                keyboardType="phone-pad"
                className="mb-0"
              />
            </Card>

            <Card className="p-4 mb-5">
              <SectionTitle
                icon="shield-checkmark-outline"
                title="Cuenta y seguridad"
                subtitle="Usuario y contraseña de acceso"
              />
              <Input
                label="Usuario"
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                placeholder="Nombre de usuario"
                leftIcon="at-outline"
                autoCapitalize="none"
              />
              <Input
                label="Contraseña"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                placeholder="Mínimo 6 caracteres"
                leftIcon="lock-closed-outline"
                secureTextEntry
              />
              <Input
                label="Confirmar contraseña"
                value={formData.password_confirm}
                onChangeText={(value) => updateField('password_confirm', value)}
                placeholder="Repite tu contraseña"
                leftIcon="lock-closed-outline"
                secureTextEntry
                className="mb-0"
              />
            </Card>

            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              full
              size="lg"
              icon="checkmark-circle-outline"
            />

            <Pressable
              onPress={() => router.back()}
              className="mt-5 items-center py-2 active:opacity-80"
            >
              <Text className="text-dark-600 text-sm">
                ¿Ya tienes cuenta?{' '}
                <Text className="text-primary-600 font-bold">Iniciar sesión</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
