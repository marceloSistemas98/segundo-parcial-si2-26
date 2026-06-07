import React from 'react';
import { View } from 'react-native';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import OfflineBanner from './OfflineBanner';

export default function OfflineSyncProvider({ children }) {
  const { online } = useNetworkStatus();
  const { pendingCount, syncing, lastSyncError, runSync } = useOfflineSync({ enabled: true });

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner
        online={online}
        pendingCount={pendingCount}
        syncing={syncing}
        lastSyncError={lastSyncError}
        onRetrySync={runSync}
      />
      {children}
    </View>
  );
}
