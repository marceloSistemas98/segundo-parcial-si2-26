import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe, handleNextAction } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Loading from '../../src/components/ui/Loading';
import { paymentsApi } from '../../src/api/payments.api';
import { assignmentsApi } from '../../src/api/assignments.api';
import { useAuthStore } from '../../src/store/auth.store';

export default function PaymentScreen() {
  const { assignmentId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { confirmPayment, createPaymentMethod } = useStripe();
  const { user } = useAuthStore();
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data } = await assignmentsApi.getById(assignmentId);
      return data;
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: (id) => paymentsApi.createIntent(id),
  });

  const handlePayment = async () => {
    if (!cardComplete) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor completa la información de tu tarjeta',
      });
      return;
    }

    setProcessing(true);

    try {
      // Paralelo: refrescar asignación y crear PaymentIntent al mismo tiempo
      const [intentResponse] = await Promise.all([
        createPaymentIntentMutation.mutateAsync(assignmentId),
        queryClient.fetchQuery({
          queryKey: ['assignment', assignmentId],
          queryFn: async () => {
            const { data } = await assignmentsApi.getById(assignmentId);
            return data;
          },
        }),
      ]);
      const intentData = intentResponse.data;

      if (!intentData.client_secret) {
        throw new Error('No se pudo crear el intento de pago');
      }

      const clientSecret = intentData.client_secret;

      // 2) Crear PaymentMethod desde CardField (evita "Card details not complete" al confirmar)
      const billingDetails = {
        email: user?.email?.trim() || undefined,
        name:
          [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
          user?.username ||
          undefined,
      };

      const { paymentMethod, error: pmError } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: { billingDetails },
      });

      if (pmError) {
        throw new Error(pmError.message || 'Completa los datos de la tarjeta');
      }
      if (!paymentMethod?.id) {
        throw new Error('No se pudo leer la tarjeta');
      }

      // 3) Confirmar el PaymentIntent con el payment_method ya creado
      let { error: confirmErr, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId: paymentMethod.id,
        },
      });

      if (confirmErr) {
        throw new Error(confirmErr.message);
      }

      // 3b) 3D Secure u otra acción pendiente
      const needsAction = String(paymentIntent?.status || '') === 'RequiresAction';
      if (needsAction) {
        const next = await handleNextAction(clientSecret);
        if (next.error) {
          throw new Error(next.error.message);
        }
        paymentIntent = next.paymentIntent;
      }

      const paid =
        paymentIntent &&
        String(paymentIntent.status || '').toLowerCase() === 'succeeded';

      if (paid) {
        // Confirmar en el backend
        await paymentsApi.confirm(intentData.payment_intent_id);

        Toast.show({
          type: 'success',
          text1: 'Pago exitoso',
          text2: 'Tu pago ha sido procesado correctamente',
        });

        // Invalidar queries y navegar
        queryClient.invalidateQueries(['assignment', assignmentId]);
        queryClient.invalidateQueries(['incidents']);

        const wsId = assignment?.workshop?.id ?? assignment?.workshop;
        if (wsId) {
          router.replace(`/rate/${assignmentId}`);
        } else {
          router.replace('/(app)/home');
        }
      } else {
        throw new Error(`Estado del pago: ${paymentIntent?.status || 'desconocido'}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'No se pudo completar el pago',
        error.message || 'Intenta de nuevo o verifica los datos de la tarjeta.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando información del servicio..." />;
  }

  if (!assignment) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-dark-900 font-bold text-xl mt-4 text-center">
          Servicio no encontrado
        </Text>
        <Button
          title="Volver"
          onPress={() => router.back()}
          variant="primary"
          size="md"
          className="mt-6"
        />
      </SafeAreaView>
    );
  }

  const totalAmount = Number(assignment.service_cost || 0);
  const serviceFee = 0;
  const finalAmount = totalAmount;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-dark-900 font-bold text-2xl mb-2">
            Pagar Servicio
          </Text>
          <Text className="text-dark-600 text-base mb-6">
            Completa el pago de tu servicio
          </Text>

        {/* Información del taller */}
        {assignment.workshop && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-3">
                <Ionicons name="construct" size={24} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-dark-900 font-bold text-base">
                  {assignment.workshop.name}
                </Text>
                <Text className="text-dark-600 text-sm">
                  Taller
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Resumen del pago */}
        <Card className="p-4 mb-6">
          <Text className="text-dark-900 font-semibold mb-4 text-lg">
            Resumen del Pago
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-dark-600">Costo del servicio</Text>
            <Text className="text-dark-900 font-semibold">
              ${totalAmount.toFixed(2)} Bs
            </Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-dark-600">Comisión de plataforma</Text>
            <Text className="text-dark-900 font-semibold">
              ${serviceFee.toFixed(2)} (incluida en el total)
            </Text>
          </View>

          <View className="border-t border-dark-200 pt-3 mt-3">
            <View className="flex-row justify-between">
              <Text className="text-dark-900 font-bold text-lg">Total</Text>
              <Text className="text-primary-600 font-bold text-xl">
                ${finalAmount.toFixed(2)} Bs
              </Text>
            </View>
          </View>
        </Card>

          {/* Formulario de tarjeta */}
          <Text className="text-dark-700 font-semibold mb-3 text-base">
            Información de la tarjeta
          </Text>

          <Card className="p-4 mb-4 bg-white">
            <View style={{ minHeight: 65 }}>
              <CardField
                postalCodeEnabled={true}
                placeholders={{
                  number: '4242 4242 4242 4242',
                  expiration: 'MM/AA',
                  cvc: 'CVC',
                }}
                cardStyle={{
                  backgroundColor: '#FFFFFF',
                  textColor: '#0f172a',
                  placeholderColor: '#94a3b8',
                  borderColor: '#cbd5e1',
                  borderWidth: 1,
                  borderRadius: 8,
                  fontSize: 16,
                }}
                style={{
                  width: '100%',
                  height: 55,
                  marginVertical: 5,
                }}
                onCardChange={(cardDetails) => {
                  setCardComplete(cardDetails.complete);
                }}
              />
            </View>

            <View className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <Text className="text-amber-800 text-xs">
                💳 Prueba: 4242 4242 4242 4242 | Vencimiento: 12/25 | CVC: 123
              </Text>
            </View>
          </Card>

          <View className="flex-row items-start bg-blue-50 rounded-lg p-3 mb-4">
            <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
            <Text className="text-dark-700 text-xs ml-2 flex-1">
              Pago seguro vía Stripe. No almacenamos tu información bancaria.
            </Text>
          </View>

          <View style={{ marginBottom: Platform.OS === 'ios' ? 20 : 10 }}>
            <Button
              title={`Pagar $${finalAmount.toFixed(2)} Bs`}
              onPress={handlePayment}
              loading={processing}
              disabled={!cardComplete || processing}
              full
              size="lg"
              icon="card"
              className="mb-3"
            />

            <Button
              title="Cancelar"
              onPress={() => router.back()}
              variant="ghost"
              size="md"
              full
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
