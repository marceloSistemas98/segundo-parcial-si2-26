import { incidentsApi } from '../api/incidents.api';
import {
  getQueueItems,
  updateQueueItem,
  resolveServerIncidentId,
  SYNC_STATUS,
  OP,
} from './queue';

let syncing = false;

function buildEvidenceFormData(meta) {
  const form = new FormData();
  (meta.photos || []).forEach((p, idx) => {
    form.append('photos', {
      uri: p.uri,
      name: p.name || `photo_${idx}.jpg`,
      type: p.type || 'image/jpeg',
    });
  });
  if (meta.audio) {
    form.append('audio', {
      uri: meta.audio.uri,
      name: meta.audio.name || 'audio.m4a',
      type: meta.audio.type || 'audio/mp4',
    });
  }
  return form;
}

async function syncOneItem(item) {
  if (item.type === OP.INCIDENT_CREATE) {
    const payload = {
      ...item.payload,
      client_request_id: item.clientRequestId,
    };
    const { data } = await incidentsApi.create(payload);
    const serverId = data?.id ?? data?.pk;
    if (serverId == null) throw new Error('Sin id de incidente en respuesta');
    await resolveServerIncidentId(item.id, serverId);
    return { serverId, data };
  }

  if (item.type === OP.EVIDENCE_UPLOAD) {
    const incidentId = item.serverIncidentId;
    if (!incidentId) throw new Error('Incidente aún no sincronizado');
    const form = buildEvidenceFormData(item.payload);
    const hasFiles =
      (item.payload.photos?.length || 0) > 0 || !!item.payload.audio;
    if (!hasFiles) return { skipped: true };
    await incidentsApi.uploadEvidence(incidentId, form);
    return { incidentId };
  }

  throw new Error(`Tipo de cola desconocido: ${item.type}`);
}

/**
 * Procesa la cola offline (una pasada). Devuelve resumen.
 */
export async function processOfflineQueue() {
  if (syncing) return { skipped: true };
  syncing = true;
  const summary = { synced: 0, failed: 0, errors: [] };
  try {
    let queue = await getQueueItems();
    const ordered = [
      ...queue.filter((i) => i.type === OP.INCIDENT_CREATE),
      ...queue.filter((i) => i.type === OP.EVIDENCE_UPLOAD),
    ];

    for (const item of ordered) {
      if (item.status === SYNC_STATUS.SYNCED) continue;
      await updateQueueItem(item.id, { status: SYNC_STATUS.SYNCING, error: null });
      try {
        const result = await syncOneItem(item);
        if (item.type === OP.INCIDENT_CREATE && result.serverId) {
          await resolveServerIncidentId(item.id, result.serverId);
        }
        const patch = {
          status: SYNC_STATUS.SYNCED,
          error: null,
        };
        if (result.serverId) patch.serverIncidentId = result.serverId;
        await updateQueueItem(item.id, patch);
        summary.synced += 1;
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || 'Error de sincronización';
        await updateQueueItem(item.id, {
          status: SYNC_STATUS.FAILED,
          retryCount: (item.retryCount || 0) + 1,
          error: String(msg),
        });
        summary.failed += 1;
        summary.errors.push({ id: item.id, error: msg });
      }
    }
  } finally {
    syncing = false;
  }
  return summary;
}

export function isSyncInProgress() {
  return syncing;
}
