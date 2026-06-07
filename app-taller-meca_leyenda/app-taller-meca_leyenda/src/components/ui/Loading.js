import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function Loading({ message = 'Cargando...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-dark-600 mt-4 text-base">{message}</Text>
      </View>
    );
  }

  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text className="text-dark-600 mt-4 text-base">{message}</Text>
    </View>
  );
}
