import { createClientRequestId } from './clientRequestId';
import { loadQueue, saveQueue, loadLocalIncidentMap, saveLocalIncidentMap } from './storage';

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
};

export const OP = {
  INCIDENT_CREATE: 'incident_create',
  EVIDENCE_UPLOAD: 'evidence_upload',
};

/** @returns {Promise<import('./types').QueueItem[]>} */
export async function getQueueItems() {
  return loadQueue();
}

export async function getPendingCount() {
  const q = await loadQueue();
  return q.filter((i) => i.status === SYNC_STATUS.PENDING || i.status === SYNC_STATUS.FAILED).length;
}

export async function enqueueIncidentCreate(payload) {
  const clientRequestId = createClientRequestId();
  const localId = clientRequestId;
  const item = {
    id: localId,
    type: OP.INCIDENT_CREATE,
    status: SYNC_STATUS.PENDING,
    clientRequestId,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    error: null,
    payload,
  };
  const queue = await loadQueue();
  queue.push(item);
  await saveQueue(queue);
  const map = await loadLocalIncidentMap();
  map[localId] = { serverId: null, clientRequestId };
  await saveLocalIncidentMap(map);
  return item;
}

export async function enqueueEvidenceUpload({ localIncidentId, serverIncidentId, formMeta }) {
  const id = createClientRequestId();
  const item = {
    id,
    type: OP.EVIDENCE_UPLOAD,
    status: SYNC_STATUS.PENDING,
    localIncidentId: localIncidentId || null,
    serverIncidentId: serverIncidentId ?? null,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    error: null,
    payload: formMeta,
  };
  const queue = await loadQueue();
  queue.push(item);
  await saveQueue(queue);
  return item;
}

export async function updateQueueItem(id, patch) {
  const queue = await loadQueue();
  const idx = queue.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  queue[idx] = { ...queue[idx], ...patch };
  await saveQueue(queue);
  return queue[idx];
}

export async function resolveServerIncidentId(localId, serverId) {
  const map = await loadLocalIncidentMap();
  if (map[localId]) {
    map[localId].serverId = serverId;
    await saveLocalIncidentMap(map);
  }
  const queue = await loadQueue();
  let changed = false;
  for (const item of queue) {
    if (item.localIncidentId === localId && !item.serverIncidentId) {
      item.serverIncidentId = serverId;
      changed = true;
    }
  }
  if (changed) await saveQueue(queue);
}

export async function getServerIdForLocal(localId) {
  const map = await loadLocalIncidentMap();
  return map[localId]?.serverId ?? null;
}

export async function getLocalPendingIncidents() {
  const queue = await loadQueue();
  return queue.filter((i) => i.type === OP.INCIDENT_CREATE && i.status !== SYNC_STATUS.SYNCED);
}
