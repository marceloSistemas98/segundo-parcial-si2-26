import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
      setIsInternetReachable(state.isInternetReachable !== false);
    });
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected !== false);
      setIsInternetReachable(state.isInternetReachable !== false);
    });
    return () => unsub();
  }, []);

  const online = isConnected && isInternetReachable !== false;

  return { online, isConnected, isInternetReachable };
}
