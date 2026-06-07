import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processOfflineQueue } from '../offline/syncManager';
import { getPendingCount } from '../offline/queue';

export function useOfflineSync({ enabled = true } = {}) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);
  const ranRef = useRef(false);

  const refreshPending = useCallback(async () => {
    const n = await getPendingCount();
    setPendingCount(n);
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setLastSyncError(null);
    try {
      const summary = await processOfflineQueue();
      if (summary.failed > 0 && summary.errors?.length) {
        setLastSyncError(summary.errors[0].error);
      }
      await refreshPending();
      return summary;
    } catch (e) {
      setLastSyncError(e?.message || 'Error al sincronizar');
      await refreshPending();
      return null;
    } finally {
      setSyncing(false);
    }
  }, [refreshPending]);

  useEffect(() => {
    if (!enabled) return;
    refreshPending();
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      if (online) {
        runSync();
      }
    });
    if (!ranRef.current) {
      ranRef.current = true;
      NetInfo.fetch().then((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          runSync();
        }
      });
    }
    return () => unsub();
  }, [enabled, runSync, refreshPending]);

  return { pendingCount, syncing, lastSyncError, runSync, refreshPending };
}
