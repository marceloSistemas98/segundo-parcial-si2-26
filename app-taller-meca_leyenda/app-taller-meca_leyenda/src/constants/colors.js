/** Tokens alineados con la web (blanco + azul). */
export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',

  secondary: '#3b82f6',
  secondaryDark: '#2563eb',

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#2563eb',

  background: '#f0f7ff',
  backgroundElevated: '#f8fafc',
  surface: 'rgba(255, 255, 255, 0.82)',
  surfaceSolid: '#ffffff',
  surfaceDark: '#1e293b',

  text: '#0f172a',
  textLight: '#64748b',
  textDark: '#f8fafc',

  border: 'rgba(37, 99, 235, 0.12)',
  borderSolid: '#e2e8f0',
  borderDark: '#334155',

  white: '#ffffff',
  black: '#000000',

  // Status colors
  pending: '#f59e0b',
  analyzing: '#3b82f6',
  waiting: '#8b5cf6',
  assigned: '#06b6d4',
  inProgress: '#10b981',
  completed: '#10b981',
  cancelled: '#6b7280',

  // Priority colors
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
};

export const STATUS_COLORS = {
  pending: COLORS.pending,
  analyzing: COLORS.analyzing,
  waiting_workshop: COLORS.waiting,
  assigned: COLORS.assigned,
  in_progress: COLORS.inProgress,
  completed: COLORS.completed,
  cancelled: COLORS.cancelled,
};

export const PRIORITY_COLORS = {
  low: COLORS.low,
  medium: COLORS.medium,
  high: COLORS.high,
  critical: COLORS.critical,
};

export const GLASS = {
  background: 'rgba(255, 255, 255, 0.82)',
  border: 'rgba(37, 99, 235, 0.12)',
  tabBar: 'rgba(255, 255, 255, 0.92)',
};
