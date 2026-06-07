import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Linking,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS } from '../../constants/colors';
import { formatDistance } from '../../utils/format';
import Button from '../ui/Button';

const SERVICE_LABELS = {
  battery: 'Batería',
  tire: 'Llantas',
  towing: 'Grúa',
  engine: 'Motor',
  accident: 'Accidente',
  locksmith: 'Cerrajería',
  general: 'Mecánica general',
  bateria: 'Batería',
  llanta: 'Llantas',
  remolque: 'Grúa',
  motor: 'Motor',
  accidente: 'Accidente',
  cerrajeria: 'Cerrajería',
};

function serviceLabels(services = []) {
  return services.map((s) => SERVICE_LABELS[s] || s).filter(Boolean);
}

function WorkshopLogo({ uri, size = 52 }) {
  return (
    <View
      className="rounded-xl bg-primary-50 items-center justify-center overflow-hidden border border-primary-100"
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Ionicons name="build-outline" size={size * 0.42} color={COLORS.primary} />
      )}
    </View>
  );
}

function RatingRow({ rating, distanceKm, compact }) {
  return (
    <View className={`flex-row items-center flex-wrap ${compact ? 'mt-1' : 'mt-2'}`}>
      <View className="flex-row items-center mr-3 mb-1">
        <Ionicons name="star" size={compact ? 14 : 16} color="#f59e0b" />
        <Text className={`text-dark-700 ml-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {rating != null ? Number(rating).toFixed(1) : 'Sin calificación'}
        </Text>
      </View>
      <View className="flex-row items-center mb-1">
        <Ionicons name="navigate-outline" size={compact ? 14 : 16} color={COLORS.textLight} />
        <Text className={`text-dark-600 ml-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {distanceKm != null ? formatDistance(distanceKm) : 'Distancia no disponible'}
        </Text>
      </View>
    </View>
  );
}

function ServiceChips({ services, max = 4 }) {
  const labels = serviceLabels(services).slice(0, max);
  if (!labels.length) {
    return <Text className="text-dark-500 text-sm">Sin servicios registrados</Text>;
  }
  return (
    <View className="flex-row flex-wrap gap-2">
      {labels.map((label) => (
        <View
          key={label}
          className="px-2.5 py-1 rounded-full border border-primary-200"
          style={{ backgroundColor: 'rgba(219, 234, 254, 0.65)' }}
        >
          <Text className="text-primary-700 text-xs font-medium">{label}</Text>
        </View>
      ))}
    </View>
  );
}

function WorkshopListItem({ workshop, logoUri, onPress }) {
  const preview = serviceLabels(workshop.services).slice(0, 2).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-primary-100 active:opacity-90"
      style={{ backgroundColor: GLASS.background }}
    >
      <View className="p-3 flex-row items-center">
        <WorkshopLogo uri={logoUri} />
        <View className="flex-1 ml-3 min-w-0">
          <Text className="text-dark-900 font-bold text-base" numberOfLines={2}>
            {workshop.name}
          </Text>
          <RatingRow rating={workshop.rating_avg} distanceKm={workshop.distance_km} compact />
          {preview ? (
            <Text className="text-dark-500 text-xs mt-1" numberOfLines={1}>
              {preview}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" style={{ marginLeft: 4 }} />
      </View>
    </Pressable>
  );
}

function WorkshopDetail({ workshop, logoUri }) {
  const labels = serviceLabels(workshop.services);

  const handleCall = () => {
    const phone = workshop.phone?.trim();
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
    >
      <View className="flex-row items-start mb-4">
        <WorkshopLogo uri={logoUri} size={64} />
        <View className="flex-1 ml-3 min-w-0">
          <Text className="text-dark-900 font-bold text-xl leading-6">{workshop.name}</Text>
          <RatingRow rating={workshop.rating_avg} distanceKm={workshop.distance_km} />
        </View>
      </View>

      {workshop.description ? (
        <View className="mb-4">
          <Text className="text-dark-800 font-semibold text-sm mb-1">Acerca del taller</Text>
          <Text className="text-dark-600 text-sm leading-5">{workshop.description}</Text>
        </View>
      ) : null}

      <View className="mb-4">
        <Text className="text-dark-800 font-semibold text-sm mb-2">Servicios</Text>
        <ServiceChips services={workshop.services} max={8} />
      </View>

      {workshop.phone ? (
        <View
          className="rounded-2xl border border-primary-100 p-3 mb-2 flex-row items-center"
          style={{ backgroundColor: 'rgba(239, 246, 255, 0.85)' }}
        >
          <View className="w-10 h-10 rounded-full bg-primary-600 items-center justify-center mr-3">
            <Ionicons name="call-outline" size={20} color="#fff" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-dark-500 text-xs font-medium">Teléfono</Text>
            <Text className="text-dark-900 font-semibold text-base">{workshop.phone}</Text>
          </View>
          <Button title="Llamar" onPress={handleCall} variant="primary" size="sm" icon="call" />
        </View>
      ) : null}

      {workshop.address ? (
        <View className="flex-row items-start mt-2 mb-1">
          <Ionicons name="location-outline" size={18} color={COLORS.textLight} style={{ marginTop: 2 }} />
          <Text className="text-dark-600 text-sm ml-2 flex-1 leading-5">{workshop.address}</Text>
        </View>
      ) : null}

      {labels.length > 4 ? (
        <Text className="text-dark-400 text-xs mt-3">
          {labels.length} servicios disponibles en este taller
        </Text>
      ) : null}
    </ScrollView>
  );
}

/**
 * Modal con lista legible de talleres cercanos y vista de detalle.
 */
export default function NearbyWorkshopsModal({
  visible,
  onClose,
  workshops = [],
  loading = false,
  selectedWorkshop,
  onSelectWorkshop,
  onClearSelection,
  resolveLogoUri,
}) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const showDetail = Boolean(selectedWorkshop);
  const sheetMaxHeight = Math.min(winH * 0.88, 720);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />

        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              maxHeight: sheetMaxHeight,
              backgroundColor: COLORS.backgroundElevated,
            },
          ]}
        >
          <View className="items-center pt-2 pb-1">
            <View className="w-10 h-1 rounded-full bg-primary-200" />
          </View>

          <View className="px-4 pb-3 flex-row items-start justify-between border-b border-primary-100">
            <View className="flex-1 min-w-0 pr-3">
              {showDetail ? (
                <>
                  <Pressable
                    onPress={onClearSelection}
                    className="flex-row items-center mb-2 self-start"
                    hitSlop={8}
                  >
                    <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                    <Text className="text-primary-600 font-semibold text-sm ml-1">Ver todos</Text>
                  </Pressable>
                  <Text className="text-dark-900 font-bold text-lg">Detalle del taller</Text>
                </>
              ) : (
                <>
                  <Text className="text-dark-900 font-bold text-lg">Talleres cercanos</Text>
                  <Text className="text-dark-500 text-sm mt-0.5">
                    {loading
                      ? 'Buscando en tu zona…'
                      : `${workshops.length} taller${workshops.length === 1 ? '' : 'es'} verificados`}
                  </Text>
                </>
              )}
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-full items-center justify-center bg-white/80 border border-primary-100"
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={COLORS.textLight} />
            </Pressable>
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="text-dark-600 mt-3 text-sm">Cargando talleres…</Text>
            </View>
          ) : showDetail ? (
            <WorkshopDetail
              workshop={selectedWorkshop}
              logoUri={resolveLogoUri?.(selectedWorkshop.logo)}
            />
          ) : workshops.length === 0 ? (
            <View className="py-14 px-6 items-center">
              <View className="w-16 h-16 rounded-full bg-primary-50 items-center justify-center mb-4">
                <Ionicons name="construct-outline" size={32} color={COLORS.primary} />
              </View>
              <Text className="text-dark-900 font-bold text-base text-center">
                No hay talleres en tu zona
              </Text>
              <Text className="text-dark-500 text-sm text-center mt-2 leading-5">
                No encontramos talleres verificados cerca de tu ubicación. Intenta más tarde o reporta
                una emergencia para que te asignen uno.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator
              contentContainerStyle={{ padding: 16, paddingBottom: 4 }}
              keyboardShouldPersistTaps="handled"
            >
              {workshops.map((w) => (
                <WorkshopListItem
                  key={w.id}
                  workshop={w}
                  logoUri={resolveLogoUri?.(w.logo)}
                  onPress={() => onSelectWorkshop(w)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: GLASS.border,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
});
