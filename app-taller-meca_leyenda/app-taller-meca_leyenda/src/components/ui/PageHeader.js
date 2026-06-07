import React from 'react';
import { View, Text } from 'react-native';

export default function PageHeader({ title, subtitle, right, className = '' }) {
  return (
    <View className={`px-4 pt-3 pb-3 ${className}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 min-w-0">
          <Text className="text-dark-900 font-bold text-2xl tracking-tight">{title}</Text>
          {subtitle ? (
            <Text className="text-dark-500 text-sm mt-1 leading-5">{subtitle}</Text>
          ) : null}
        </View>
        {right ? <View className="shrink-0">{right}</View> : null}
      </View>
    </View>
  );
}
