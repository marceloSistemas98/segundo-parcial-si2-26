import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

export const formatDate = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  return dayjs(date).fromNow();
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '';
  return `$${Number(amount).toFixed(2)}`;
};

export const formatDistance = (km) => {
  if (!km && km !== 0) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '';
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    analyzing: 'Analizando',
    waiting_workshop: 'Buscando taller',
    assigned: 'Taller asignado',
    in_progress: 'En atención',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
};

export const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  };
  return labels[priority] || priority;
};

export const getIncidentTypeLabel = (type) => {
  const labels = {
    battery: 'Batería',
    tire: 'Llanta',
    accident: 'Accidente',
    engine: 'Motor',
    locksmith: 'Cerrajería',
    overheating: 'Sobrecalentamiento',
    other: 'Otro',
    uncertain: 'Por determinar',
  };
  return labels[type] || type;
};

export const getIncidentTypeIcon = (type) => {
  const icons = {
    battery: 'battery-dead-outline',
    tire: 'car-outline',
    accident: 'warning-outline',
    engine: 'construct-outline',
    locksmith: 'key-outline',
    overheating: 'thermometer-outline',
    other: 'alert-circle-outline',
    uncertain: 'help-circle-outline',
  };
  return icons[type] || 'alert-circle-outline';
};

/** Texto orientativo para el cliente según el estado del incidente */
export const getStatusDescription = (status) => {
  const map = {
    pending:
      'Tu reporte está registrado. En breve analizaremos la información y las evidencias que enviaste.',
    analyzing:
      'Estamos analizando tu caso (descripción, fotos y audio) para clasificar el problema y priorizarlo.',
    waiting_workshop:
      'Estamos buscando un taller disponible cerca de tu ubicación. Te avisaremos cuando haya una asignación.',
    assigned:
      'Ya hay un taller asignado. Puedes ver sus datos abajo y llamar si necesitas coordinar la asistencia.',
    in_progress:
      'El taller está atendiendo tu emergencia. Mantén el teléfono a mano por si necesitan contactarte.',
    completed:
      'El servicio fue marcado como completado. Si corresponde, podrás abonar el servicio desde la app.',
    cancelled: 'Este incidente fue cancelado. Si necesitas ayuda, puedes crear un nuevo reporte.',
  };
  return map[status] || 'Seguimos procesando tu solicitud.';
};

export const getAssignmentStatusLabel = (status) => {
  const labels = {
    offered: 'Ofrecida al taller',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    in_route: 'Técnico en camino',
    arrived: 'Técnico en el lugar',
    in_service: 'En servicio',
    completed: 'Completada',
  };
  return labels[status] || status;
};

