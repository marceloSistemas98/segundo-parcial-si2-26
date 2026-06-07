import * as ImagePicker from 'expo-image-picker';

/**
 * expo-image-picker 55+: `MediaType` es 'images' | 'videos' | 'livePhotos'.
 * Ya no existe `ImagePicker.MediaType.Images` (eso rompía galería y cámara).
 */
export const PICK_IMAGES_ONLY = ['images'];

const baseImageOptions = {
  mediaTypes: PICK_IMAGES_ONLY,
  quality: 0.85,
};

/**
 * @param {import('expo-image-picker').ImagePickerOptions} [options]
 * @returns {Promise<import('expo-image-picker').ImagePickerResult & { permissionDenied?: boolean }>}
 */
export async function pickImageFromLibrary(options = {}) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return { canceled: true, assets: null, permissionDenied: true };
  }
  return ImagePicker.launchImageLibraryAsync({ ...baseImageOptions, ...options });
}

/**
 * @param {import('expo-image-picker').ImagePickerOptions} [options]
 * @returns {Promise<import('expo-image-picker').ImagePickerResult & { permissionDenied?: boolean }>}
 */
export async function takeImageFromCamera(options = {}) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return { canceled: true, assets: null, permissionDenied: true };
  }
  return ImagePicker.launchCameraAsync({ ...baseImageOptions, ...options });
}
