import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { COLORS } from '../../constants/colors';
import { formatRelativeTime, getIncidentTypeLabel, getIncidentTypeIcon, getStatusLabel, getPriorityLabel } from '../../utils/format';

export default function IncidentCard({ incident, onPress }) {
  return (
    <Card onPress={onPress} className="p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Ionicons name={getIncidentTypeIcon(incident.incident_type)} size={20} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-dark-900 font-bold text-base">
              {getIncidentTypeLabel(incident.incident_type)}
            </Text>
            <Text className="text-dark-500 text-sm">
              {formatRelativeTime(incident.created_at)}
            </Text>
          </View>
        </View>

        <Badge
          label={getStatusLabel(incident.status)}
          variant={incident.status}
          type="status"
          size="sm"
        />
      </View>

      {incident.vehicle && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="car" size={16} color="#64748b" />
          <Text className="text-dark-600 text-sm ml-2">
            {incident.vehicle.brand} {incident.vehicle.model} • {incident.vehicle.plate}
          </Text>
        </View>
      )}

      {incident.priority && (
        <View className="flex-row items-center mb-2">
          <Text className="text-dark-600 text-sm mr-2">Prioridad:</Text>
          <Badge
            label={getPriorityLabel(incident.priority)}
            variant={incident.priority}
            type="priority"
            size="sm"
          />
        </View>
      )}

      {incident.description && (
        <Text className="text-dark-700 text-sm mt-2" numberOfLines={2}>
          {incident.description}
        </Text>
      )}

      {incident.assignment && (
        <View className="mt-3 pt-3 border-t border-primary-100">
          <View className="flex-row items-center flex-wrap">
            <Ionicons name="construct" size={16} color="#10b981" />
            <Text className="text-dark-700 font-semibold text-sm ml-2">
              {incident.assignment.workshop?.name || 'Taller asignado'}
            </Text>
          </View>
          {['assigned', 'in_progress'].includes(incident.status) &&
          ['accepted', 'in_route', 'arrived', 'in_service'].includes(incident.assignment.status) ? (
            <View className="flex-row items-center mt-2">
              <Ionicons name="navigate" size={14} color="#059669" />
              <Text className="text-emerald-800 text-xs ml-1.5 font-medium">
                Mapa en vivo del técnico al abrir el detalle
              </Text>
            </View>
          ) : null}
          {incident.assignment.rating?.score ? (
            <View className="flex-row items-center mt-2">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-dark-600 text-sm ml-1">
                {incident.assignment.rating.score}/5
                {incident.assignment.payment?.status === 'client_paid' ? ' · Pagado' : ''}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </Card>
  );
}
