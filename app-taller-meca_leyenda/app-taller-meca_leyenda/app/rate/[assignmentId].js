import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Button from '../../src/components/ui/Button';
import Loading from '../../src/components/ui/Loading';
import { assignmentsApi } from '../../src/api/assignments.api';
import { workshopsApi } from '../../src/api/workshops.api';

export default function RateServiceScreen() {
  const { assignmentId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  /** 0 = sin elegir aún; 1–5 = calificación */
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  const { data: assignment, isLoading, isError } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data } = await assignmentsApi.getById(assignmentId);
      return data;
    },
    enabled: !!assignmentId,
  });

  const workshopId = assignment?.workshop?.id ?? assignment?.workshop;
  const alreadyRated = Boolean(assignment?.client_rating?.score);

  const mutation = useMutation({
    mutationFn: () =>
      workshopsApi.rate(workshopId, {
        assignment_id: Number(assignmentId),
        score,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident'] });
      Toast.show({
        type: 'success',
        text1: 'Gracias',
        text2: 'Tu calificación fue enviada',
      });
      router.replace('/(app)/home');
    },
    onError: (err) => {
      Toast.show({
        type: 'error',
        text1: 'No se pudo enviar',
        text2: err.response?.data?.error || err.response?.data?.detail || err.message,
      });
    },
  });

  if (isLoading) {
    return <Loading fullScreen message="Cargando servicio..." />;
  }

  if (isError || !assignment || !workshopId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          No se pudo cargar el servicio
        </Text>
        <Button title="Volver" onPress={() => router.back()} variant="primary" className="mt-6" />
      </SafeAreaView>
    );
  }

  if (alreadyRated) {
    return (
      <SafeAreaView className="flex-1 bg-white px-6 justify-center">
        <Ionicons name="star" size={48} color="#fbbf24" />
        <Text className="text-dark-900 font-bold text-xl mt-4">Ya calificaste este servicio</Text>
        <Button title="Ir al inicio" onPress={() => router.replace('/(app)/home')} variant="primary" className="mt-6" />
      </SafeAreaView>
    );
  }

  const workshopName = assignment.workshop?.name || 'Taller';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Text className="text-dark-900 font-bold text-2xl mb-2">Calificar servicio</Text>
          <Text className="text-dark-600 text-base mb-6">
            ¿Cómo fue tu experiencia con {workshopName}?
          </Text>

          <View className="flex-row justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setScore(n)}
                accessibilityRole="button"
                accessibilityLabel={`${n} estrella${n > 1 ? 's' : ''}`}
                hitSlop={8}
              >
                <Ionicons
                  name={score > 0 && n <= score ? 'star' : 'star-outline'}
                  size={40}
                  color={score > 0 && n <= score ? '#fbbf24' : '#cbd5e1'}
                />
              </Pressable>
            ))}
          </View>
          <Text className="text-center text-dark-500 text-sm mb-2">
            {score === 0 ? 'Toca las estrellas para calificar' : `${score} de 5 estrellas`}
          </Text>

          <Text className="text-dark-700 font-semibold mb-2">Comentario (opcional)</Text>
          <TextInput
            className="border border-dark-200 rounded-xl p-4 text-dark-900 min-h-[120px] bg-white"
            multiline
            value={comment}
            onChangeText={setComment}
            placeholder="Escribe un comentario si lo deseas…"
            placeholderTextColor="#94a3b8"
            textAlignVertical="top"
          />

          <Button
            title="Enviar calificación"
            onPress={() => {
              if (score < 1) {
                Toast.show({
                  type: 'error',
                  text1: 'Calificación requerida',
                  text2: 'Elige de 1 a 5 estrellas',
                });
                return;
              }
              mutation.mutate();
            }}
            loading={mutation.isPending}
            disabled={mutation.isPending}
            full
            size="lg"
            icon="send"
            className="mt-6"
          />
          <Button
            title="Omitir"
            onPress={() => router.replace('/(app)/home')}
            variant="ghost"
            full
            className="mt-2"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
