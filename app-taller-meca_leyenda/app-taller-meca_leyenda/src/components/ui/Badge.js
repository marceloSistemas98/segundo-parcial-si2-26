import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../constants/colors';

export default function Badge({
  label,
  variant = 'default',
  type = 'status',
  icon,
  size = 'md',
  className = '',
}) {
  const getBackgroundColor = () => {
    if (type === 'status' && STATUS_COLORS[variant]) {
      return STATUS_COLORS[variant];
    }
    if (type === 'priority' && PRIORITY_COLORS[variant]) {
      return PRIORITY_COLORS[variant];
    }

    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      default: '#64748b',
    };
    return colors[variant] || colors.default;
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const bgColor = getBackgroundColor();

  return (
    <View
      className={`
        flex-row items-center rounded-full self-start
        ${sizeStyles[size]}
        ${className}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={size === 'lg' ? 16 : size === 'sm' ? 12 : 14}
          color="#fff"
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        className={`
          text-white font-semibold
          ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}
        `}
      >
        {label}
      </Text>
    </View>
  );
}
