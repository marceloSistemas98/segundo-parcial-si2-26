import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

/**
 * Contenedor base del perfil cliente: fondo azul claro + orbes decorativos (estilo web).
 */
export default function AppScreen({
  children,
  edges = ['top'],
  className = '',
  orbs = true,
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {orbs ? (
        <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
          <View
            className="absolute rounded-full"
            style={{
              top: -96,
              left: -64,
              width: 288,
              height: 288,
              backgroundColor: 'rgba(59, 130, 246, 0.14)',
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              top: '22%',
              right: -80,
              width: 256,
              height: 256,
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              bottom: 120,
              left: '18%',
              width: 192,
              height: 192,
              backgroundColor: 'rgba(96, 165, 250, 0.12)',
            }}
          />
        </View>
      ) : null}
      <SafeAreaView className={`flex-1 ${className}`} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}
