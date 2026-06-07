import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { GLASS } from '../../constants/colors';

export default function Card({ children, className = '', onPress, variant = 'glass', ...props }) {
  const Component = onPress ? TouchableOpacity : View;
  const activeOpacity = onPress ? 0.85 : 1;

  const glassStyle =
    variant === 'glass'
      ? {
          backgroundColor: GLASS.background,
          borderColor: GLASS.border,
          shadowColor: '#2563eb',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 2,
        }
      : {
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
        };

  return (
    <Component
      onPress={onPress}
      activeOpacity={activeOpacity}
      className={`rounded-2xl border ${className}`}
      style={glassStyle}
      {...props}
    >
      {children}
    </Component>
  );
}
