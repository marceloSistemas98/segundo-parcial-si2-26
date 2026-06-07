import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getLocalPendingIncidents, getServerIdForLocal, SYNC_STATUS } from '../../offline/queue';
import { processOfflineQueue } from '../../offline/syncManager';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function PendingIncidentStatus({ localClientRequestId }) {
  const { online } = useNetworkStatus();
  const [item, setItem] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    const pending = await getLocalPendingIncidents();
    const found = pending.find((p) => p.clientRequestId === localClientRequestId);
    setItem(found || null);
    const serverId = await getServerIdForLocal(localClientRequestId);
    if (serverId) {
      router.replace(`/emergency/status/${serverId}`);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [localClientRequestId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await processOfflineQueue();
      await refresh();
    } finally {
      setSyncing(false);
    }
  };

  const statusLabel =
    item?.status === SYNC_STATUS.FAILED
      ? 'Error al enviar'
      : item?.status === SYNC_STATUS.SYNCING
        ? 'Enviando…'
        : 'Pendiente de sincronización';

  return (
    <Card className="p-4 mb-4 bg-amber-50 border-amber-200">
      <Text className="text-amber-900 font-bold text-lg mb-1">{statusLabel}</Text>
      <Text className="text-dark-700 text-sm mb-2">
        Tu emergencia está guardada en el teléfono. Cuando haya internet se registrará en el
        servidor automáticamente.
      </Text>
      {item?.error ? (
        <Text className="text-red-700 text-xs mb-2">{item.error}</Text>
      ) : null}
      {online ? (
        <Button title="Sincronizar ahora" onPress={handleSync} loading={syncing} size="sm" />
      ) : (
        <Text className="text-dark-600 text-xs">Sin conexión — esperando red…</Text>
      )}
    </Card>
  );
}
