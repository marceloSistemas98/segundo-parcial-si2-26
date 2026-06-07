import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS } from '../../constants/colors';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  editable = true,
  className = '',
  ...props
}) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-dark-700 font-semibold mb-2 text-sm">{label}</Text>
      )}

      <View
        className={`
          flex-row items-center rounded-xl px-4
          ${multiline ? 'py-3' : 'h-12'}
          ${error ? 'border-red-500' : isFocused ? 'border-2 border-primary-500' : 'border border-primary-200'}
          ${!editable ? 'opacity-70' : ''}
        `}
        style={{
          backgroundColor: editable ? GLASS.background : 'rgba(248, 250, 252, 0.9)',
        }}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={COLORS.textLight}
            style={{ marginRight: 10 }}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            flex-1 text-dark-900 text-base
            ${multiline ? 'min-h-[80px]' : ''}
          `}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
            <Ionicons name={isSecure ? 'eye-off' : 'eye'} size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}
