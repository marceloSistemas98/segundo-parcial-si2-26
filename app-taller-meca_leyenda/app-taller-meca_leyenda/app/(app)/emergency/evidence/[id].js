import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Alert, Pressable } from 'react-native';
import AppScreen from '../../../../src/components/ui/AppScreen';
import { COLORS, GLASS } from '../../../../src/constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { pickImageFromLibrary, takeImageFromCamera } from '../../../../src/utils/imagePicker';
import Toast from 'react-native-toast-message';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';
import { useAudioRecorder } from '../../../../src/hooks/useAudioRecorder';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import { incidentsApi } from '../../../../src/api/incidents.api';
import { useIncidentStore } from '../../../../src/store/incident.store';
import { formatApiError } from '../../../../src/utils/apiErrors';
import { resolveIncidentId, isLocalIncidentId } from '../../../../src/utils/incidentRoute';
import { useNetworkStatus } from '../../../../src/hooks/useNetworkStatus';
import { enqueueEvidenceUpload } from '../../../../src/offline/queue';
import { getServerIdForLocal } from '../../../../src/offline/queue';

function extFromUri(uri) {
  const base = (uri || '').split('/').pop() || '';
  return base.split('?')[0].split('.').pop() || '';
}

function imageMime(ext) {
  const e = (ext || '').toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  if (e === 'heic' || e === 'heif') return 'image/heic';
  return `image/${e || 'jpeg'}`;
}

function audioMime(ext) {
  const e = (ext || '').toLowerCase();
  if (e === 'm4a' || e === 'mp4' || e === 'caf') return 'audio/mp4';
  if (e === 'aac') return 'audio/aac';
  if (e === 'wav') return 'audio/wav';
  if (e === 'webm') return 'audio/webm';
  return `audio/${e || 'mpeg'}`;
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

const STEPS = [
  { n: 1, label: 'Ubicación y vehículo' },
  { n: 2, label: 'Evidencias' },
];

function StepProgress({ current = 2 }) {
  return (
    <View className="flex-row items-center mb-4 px-1">
      {STEPS.map((step, i) => {
        const active = step.n === current;
        const done = step.n < current;
        return (
          <React.Fragment key={step.n}>
            <View className="flex-1 items-center min-w-0">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                  active
                    ? 'border-primary-600 bg-primary-600'
                    : done
                      ? 'border-primary-400 bg-primary-100'
                      : 'border-primary-200 bg-white/80'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${active ? 'text-white' : done ? 'text-primary-700' : 'text-dark-400'}`}
                >
                  {step.n}
                </Text>
              </View>
              <Text
                className={`text-[10px] font-semibold mt-1 text-center ${active ? 'text-primary-700' : 'text-dark-400'}`}
                numberOfLines={2}
              >
                {step.label}
              </Text>
            </View>
            {i < STEPS.length - 1 ? (
              <View
                className="h-0.5 flex-1 mx-1 mb-4 rounded-full"
                style={{ backgroundColor: done || active ? COLORS.primary : 'rgba(37,99,235,0.15)' }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SectionTitle({ icon, title, subtitle, badge }) {
  return (
    <View className="flex-row items-start mb-3">
      <View className="w-9 h-9 rounded-xl bg-primary-50 items-center justify-center mr-2.5 mt-0.5">
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center flex-wrap gap-2">
          <Text className="text-dark-900 font-bold text-base">{title}</Text>
          {badge != null ? (
            <View className="px-2 py-0.5 rounded-full bg-primary-100 border border-primary-200">
              <Text className="text-primary-700 text-[10px] font-bold">{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text className="text-dark-500 text-xs mt-0.5 leading-4">{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function EvidenceSummary({ photoCount, hasAudio }) {
  return (
    <View className="flex-row gap-2 mb-4">
      <View
        className="flex-1 flex-row items-center rounded-2xl border border-primary-100 px-3 py-2.5"
        style={{ backgroundColor: GLASS.background }}
      >
        <Ionicons name="images-outline" size={18} color={photoCount ? COLORS.primary : COLORS.textLight} />
        <Text className="text-dark-700 text-xs font-semibold ml-2">
          {photoCount ? `${photoCount} foto${photoCount === 1 ? '' : 's'}` : 'Sin fotos'}
        </Text>
      </View>
      <View
        className="flex-1 flex-row items-center rounded-2xl border border-primary-100 px-3 py-2.5"
        style={{ backgroundColor: GLASS.background }}
      >
        <Ionicons name="mic-outline" size={18} color={hasAudio ? COLORS.primary : COLORS.textLight} />
        <Text className="text-dark-700 text-xs font-semibold ml-2">{hasAudio ? 'Audio listo' : 'Sin audio'}</Text>
      </View>
    </View>
  );
}

function LocalAudioPreview({ uri }) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  const togglePlayback = async () => {
    if (!uri) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      /* ignore */
    }
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  if (!uri) return null;

  return (
    <View className="mt-4 w-full rounded-2xl border border-primary-100 px-3 py-3" style={{ backgroundColor: 'rgba(239,246,255,0.75)' }}>
      <View className="flex-row items-center justify-center mb-2">
        <Ionicons name="musical-notes-outline" size={16} color={COLORS.primary} />
        <Text className="text-dark-600 text-xs ml-2">
          {status.isLoaded
            ? `${formatTime(status.currentTime)} / ${formatTime(status.duration)}`
            : 'Cargando audio…'}
        </Text>
      </View>
      <Button
        title={status.playing ? 'Pausar' : 'Escuchar grabación'}
        onPress={togglePlayback}
        variant="primary"
        size="md"
        icon={status.playing ? 'pause-outline' : 'play-outline'}
        full
      />
    </View>
  );
}

export default function EvidenceScreen() {
  const { id: routeId } = useLocalSearchParams();
  const activeIncidentId = useIncidentStore((s) => s.activeIncidentId);
  const activeIncident = useIncidentStore((s) => s.activeIncident);
  const incidentId = resolveIncidentId(routeId, activeIncidentId, activeIncident);
  const { online } = useNetworkStatus();
  const localIncident = isLocalIncidentId(incidentId);

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const {
    isRecording,
    audioUri,
    startRecording: micStart,
    stopRecording: micStop,
    clearAudio,
  } = useAudioRecorder();

  const takePhoto = async () => {
    const result = await takeImageFromCamera({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.permissionDenied) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar fotos.');
      return;
    }
    if (!result.canceled && result.assets?.[0]) {
      setPhotos([...photos, result.assets[0]]);
    }
  };

  const pickImage = async () => {
    const result = await pickImageFromLibrary({
      quality: 0.7,
      allowsMultipleSelection: true,
      allowsEditing: false,
    });
    if (result.permissionDenied) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar fotos.');
      return;
    }
    if (!result.canceled && result.assets?.length) {
      setPhotos([...photos, ...result.assets]);
    }
  };

  const startRecording = async () => {
    const result = await micStart();
    if (!result.success) {
      Alert.alert(
        'Permiso requerido',
        result.error?.includes('denegado')
          ? 'Necesitamos acceso al micrófono para grabar audio.'
          : result.error || 'No se pudo iniciar la grabación'
      );
    }
  };

  const stopRecording = async () => {
    const result = await micStop();
    if (!result.ok) {
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!incidentId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se encontró el id del incidente. Vuelve a crear el reporte.',
      });
      return;
    }
    if (photos.length === 0 && !audioUri) {
      Toast.show({
        type: 'error',
        text1: 'Evidencia requerida',
        text2: 'Por favor agrega al menos una foto o grabación de audio',
      });
      return;
    }

    setUploading(true);

    const formMeta = {
      photos: photos.map((photo, index) => {
        const ext = extFromUri(photo.uri);
        return {
          uri: photo.uri,
          name: `photo_${index}.${ext || 'jpg'}`,
          type: imageMime(ext),
        };
      }),
      audio: audioUri
        ? {
            uri: audioUri,
            name: `audio.${extFromUri(audioUri) || 'm4a'}`,
            type: audioMime(extFromUri(audioUri)),
          }
        : null,
    };

    const goStatus = (id) => router.replace(`/emergency/status/${encodeURIComponent(id)}`);

    try {
      if (localIncident || !online) {
        const localKey = localIncident ? incidentId.replace(/^local:/, '') : incidentId;
        const serverId = localIncident ? await getServerIdForLocal(localKey) : incidentId;
        await enqueueEvidenceUpload({
          localIncidentId: localKey,
          serverIncidentId: serverId,
          formMeta,
        });
        Toast.show({
          type: 'info',
          text1: localIncident ? 'Evidencia guardada' : 'Sin conexión',
          text2: 'Se subirá al sincronizar el incidente',
        });
        goStatus(incidentId);
        return;
      }

      const formData = new FormData();
      formMeta.photos.forEach((p) => formData.append('photos', p));
      if (formMeta.audio) formData.append('audio', formMeta.audio);

      await incidentsApi.uploadEvidence(incidentId, formData);

      Toast.show({
        type: 'success',
        text1: 'Evidencia agregada',
        text2: 'Tu incidente está siendo analizado',
      });

      goStatus(incidentId);
    } catch (error) {
      const aborted = error?.name === 'AbortError';
      const msg = typeof error?.message === 'string' ? error.message : '';
      const isNetwork =
        aborted ||
        error?.code === 'ERR_NETWORK' ||
        msg === 'Network Error' ||
        msg.includes('Network request failed') ||
        !error?.response;
      if (isNetwork) {
        try {
          const localKey = localIncident ? incidentId.replace(/^local:/, '') : incidentId;
          await enqueueEvidenceUpload({
            localIncidentId: localKey,
            serverIncidentId: localIncident ? await getServerIdForLocal(localKey) : incidentId,
            formMeta,
          });
          Toast.show({
            type: 'info',
            text1: 'Evidencia en cola',
            text2: 'Se enviará cuando haya conexión',
          });
          goStatus(incidentId);
          return;
        } catch {
          /* fallthrough */
        }
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatApiError(error.response?.data) || 'Error al subir evidencias',
      });
    } finally {
      setUploading(false);
    }
  };

  const skipEvidence = () => {
    Alert.alert(
      'Omitir Evidencias',
      '¿Estás seguro? Agregar fotos y audio nos ayuda a diagnosticar mejor el problema.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Omitir',
          onPress: () =>
            incidentId
              ? router.replace(`/emergency/status/${incidentId}`)
              : router.replace('/emergency'),
        },
      ]
    );
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View className="mb-4">
          <Text className="text-primary-600 font-semibold text-xs uppercase tracking-widest">
            Mecanic La Leyenda
          </Text>
          <Text className="text-dark-900 font-bold text-2xl tracking-tight mt-0.5">
            Agregar evidencias
          </Text>
          <Text className="text-dark-500 text-sm mt-1 leading-5">
            Fotos y audio ayudan al taller a entender tu emergencia
          </Text>
        </View>

        <StepProgress current={2} />

        {!online ? (
          <View
            className="flex-row items-center rounded-2xl border border-amber-200 px-3 py-2.5 mb-4"
            style={{ backgroundColor: 'rgba(255, 251, 235, 0.95)' }}
          >
            <Ionicons name="cloud-offline-outline" size={20} color="#d97706" />
            <Text className="text-amber-900 text-xs ml-2 flex-1 leading-4">
              Sin conexión: las evidencias se guardarán y subirán al sincronizar.
            </Text>
          </View>
        ) : null}

        <EvidenceSummary photoCount={photos.length} hasAudio={Boolean(audioUri)} />

        {/* Fotos */}
        <Card className="p-4 mb-4">
          <SectionTitle
            icon="camera-outline"
            title="Fotos del vehículo"
            subtitle="Daño visible, tablero, llanta o contexto del problema"
            badge={photos.length ? String(photos.length) : null}
          />

          {photos.length === 0 ? (
            <View
              className="items-center rounded-2xl border-2 border-dashed border-primary-200 px-4 py-8 mb-3"
              style={{ backgroundColor: 'rgba(239,246,255,0.45)' }}
            >
              <View className="w-14 h-14 rounded-2xl bg-primary-50 items-center justify-center mb-3">
                <Ionicons name="image-outline" size={28} color={COLORS.primary} />
              </View>
              <Text className="text-dark-700 font-semibold text-sm text-center">Aún no hay fotos</Text>
              <Text className="text-dark-500 text-xs text-center mt-1 leading-4">
                Toma una foto o elige desde tu galería
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap mb-3 -mx-1">
              {photos.map((photo, index) => (
                <View key={index} className="w-1/3 p-1">
                  <View className="relative rounded-xl overflow-hidden border border-primary-100">
                    <Image source={{ uri: photo.uri }} className="w-full h-28" resizeMode="cover" />
                    <Pressable
                      onPress={() => removePhoto(index)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 items-center justify-center"
                      style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View className="flex-row gap-2">
            <Button
              title="Tomar foto"
              onPress={takePhoto}
              variant="primary"
              size="md"
              icon="camera-outline"
              className="flex-1"
            />
            <Button
              title="Galería"
              onPress={pickImage}
              variant="outline"
              size="md"
              icon="images-outline"
              className="flex-1"
            />
          </View>
        </Card>

        {/* Audio */}
        <Card className="p-4 mb-4">
          <SectionTitle
            icon="mic-outline"
            title="Descripción en audio"
            subtitle="Cuéntanos el problema con tus palabras"
            badge={audioUri ? '✓' : null}
          />

          <View className="items-center py-2">
            {isRecording ? (
              <>
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-3 border-4 border-red-200"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <Ionicons name="mic" size={36} color="#fff" />
                </View>
                <Text className="text-dark-900 font-bold mb-1">Grabando…</Text>
                <Text className="text-dark-500 text-xs mb-4 text-center">Describe lo que le pasa a tu vehículo</Text>
                <Button
                  title="Detener grabación"
                  onPress={stopRecording}
                  variant="danger"
                  size="md"
                  icon="stop-circle-outline"
                  full
                />
              </>
            ) : audioUri ? (
              <>
                <View className="w-16 h-16 rounded-2xl bg-emerald-50 items-center justify-center mb-3 border border-emerald-200">
                  <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                </View>
                <Text className="text-dark-900 font-bold">Audio guardado</Text>
                <Text className="text-dark-500 text-xs mt-1 mb-2 text-center">Puedes escucharlo antes de enviar</Text>
                <LocalAudioPreview uri={audioUri} />
                <Button
                  title="Grabar de nuevo"
                  onPress={() => {
                    clearAudio();
                    startRecording();
                  }}
                  variant="outline"
                  size="sm"
                  icon="refresh-outline"
                  className="mt-4"
                  full
                />
              </>
            ) : (
              <>
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(219,234,254,0.9)' }}
                >
                  <Ionicons name="mic-outline" size={40} color={COLORS.primary} />
                </View>
                <Text className="text-dark-700 text-sm text-center leading-5 mb-4 px-2">
                  Un audio breve ayuda al taller a preparar herramientas y repuestos antes de llegar.
                </Text>
                <Button
                  title="Iniciar grabación"
                  onPress={startRecording}
                  variant="primary"
                  size="md"
                  icon="mic-outline"
                  full
                />
              </>
            )}
          </View>
        </Card>

        <View
          className="flex-row items-start rounded-2xl border border-primary-100 px-3 py-3 mb-2"
          style={{ backgroundColor: 'rgba(239,246,255,0.65)' }}
        >
          <Ionicons name="bulb-outline" size={20} color={COLORS.primary} style={{ marginTop: 1 }} />
          <Text className="text-dark-600 text-xs ml-2.5 flex-1 leading-4">
            Con fotos y audio identificamos el problema más rápido y asignamos el taller adecuado.
          </Text>
        </View>
      </ScrollView>

      <View
        className="px-4 pt-3 pb-4 border-t border-primary-100"
        style={{ backgroundColor: GLASS.tabBar }}
      >
        <Button
          title="Enviar y ver estado"
          onPress={handleSubmit}
          loading={uploading}
          full
          size="lg"
          icon="cloud-upload-outline"
          className="mb-2"
        />
        <Button
          title="Omitir este paso"
          onPress={skipEvidence}
          variant="ghost"
          size="md"
          full
        />
      </View>
    </AppScreen>
  );
}
