import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@emergencias/offline_queue_v1';
const MAP_KEY = '@emergencias/local_incident_map_v1';

export async function loadQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveQueue(items) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function loadLocalIncidentMap() {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveLocalIncidentMap(map) {
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
}
