import { useCallback, useState } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';

/**
 * Grabación de voz con expo-audio (sustituye expo-av).
 */
export function useAudioRecorder() {
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 500);
  const [audioUri, setAudioUri] = useState(null);

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Permiso de micrófono denegado');
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setAudioUri(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'No se pudo iniciar la grabación' };
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const status = recorder.getStatus();
      const uri = recorder.uri ?? status.url ?? null;
      setAudioUri(uri);
      return { ok: true, uri };
    } catch {
      return { ok: false, uri: null };
    }
  };

  const clearAudio = useCallback(() => {
    setAudioUri(null);
  }, []);

  const seconds = Math.floor(recState.durationMillis / 1000);
  const minutes = Math.floor(seconds / 60);
  const formattedDuration = `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;

  return {
    isRecording: recState.isRecording,
    audioUri,
    duration: seconds,
    formattedDuration,
    startRecording,
    stopRecording,
    clearAudio,
  };
}
