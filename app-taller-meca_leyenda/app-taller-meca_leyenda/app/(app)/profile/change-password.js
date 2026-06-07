import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import AppScreen from '../../../src/components/ui/AppScreen';
import PageHeader from '../../../src/components/ui/PageHeader';
import { authApi } from '../../../src/api/auth.api';
import { formatApiError } from '../../../src/utils/apiErrors';

export default function ChangePasswordScreen() {
  const [old_password, setOldPassword] = useState('');
  const [new_password, setNewPassword] = useState('');
  const [new_password_confirm, setNewPasswordConfirm] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        old_password,
        new_password,
        new_password_confirm,
      }),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Contraseña actualizada',
        text2: 'Usa la nueva contraseña la próxima vez que inicies sesión',
      });
      router.back();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatApiError(error.response?.data) || 'No se pudo cambiar la contraseña',
      });
    },
  });

  const submit = () => {
    if (!old_password || !new_password || !new_password_confirm) {
      Toast.show({
        type: 'error',
        text1: 'Campos incompletos',
        text2: 'Completa todos los campos',
      });
      return;
    }
    if (new_password !== new_password_confirm) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Las contraseñas nuevas no coinciden',
      });
      return;
    }
    mutation.mutate();
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <PageHeader
            title="Cambiar contraseña"
            subtitle="Introduce tu contraseña actual y elige una nueva segura."
          />

          <Input
            label="Contraseña actual"
            value={old_password}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Input
            label="Nueva contraseña"
            value={new_password}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Mínimo según política del servidor"
          />
          <Input
            label="Confirmar nueva contraseña"
            value={new_password_confirm}
            onChangeText={setNewPasswordConfirm}
            secureTextEntry
            placeholder="Repite la nueva contraseña"
          />

          <Button
            title="Actualizar contraseña"
            onPress={submit}
            loading={mutation.isPending}
            full
            size="lg"
            icon="lock-closed-outline"
            className="mt-4"
          />
          <Button title="Cancelar" onPress={() => router.back()} variant="ghost" full className="mt-2" />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
