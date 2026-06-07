import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export function useLocation(autoRequest = true) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(autoRequest);

  const requestLocation = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);
      setError(null);
      setLoading(false);
      return coords;
    } catch (err) {
      setError(err.message || 'No se pudo obtener la ubicación');
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return { location, error, loading, requestLocation };
}
