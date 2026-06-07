import { create } from 'zustand';

export const useIncidentStore = create((set) => ({
  // Draft para wizard de creación
  draftVehicleId: null,
  draftLatitude: null,
  draftLongitude: null,
  draftAddress: '',
  draftDescription: '',

  // Incidente activo en seguimiento
  activeIncident: null,
  activeIncidentId: null,

  // Evidencias en proceso de upload
  pendingEvidences: [],

  setDraft: (data) => set((state) => ({ ...state, ...data })),

  clearDraft: () =>
    set({
      draftVehicleId: null,
      draftLatitude: null,
      draftLongitude: null,
      draftAddress: '',
      draftDescription: '',
      pendingEvidences: [],
    }),

  setActiveIncident: (incident) =>
    set({
      activeIncident: incident,
      activeIncidentId: incident?.id || null,
    }),

  addPendingEvidence: (evidence) =>
    set((state) => ({
      pendingEvidences: [...state.pendingEvidences, evidence],
    })),

  removePendingEvidence: (index) =>
    set((state) => ({
      pendingEvidences: state.pendingEvidences.filter((_, i) => i !== index),
    })),

  clearPendingEvidences: () => set({ pendingEvidences: [] }),
}));
