import type { RootState } from '../index';

export const selectWorkstyleProfileRevision = (state: RootState) =>
  state.workstyleProfileProjection.revision;

export const selectWorkstyleProfilePreferredCadence = (state: RootState) =>
  state.workstyleProfileProjection.preferredCadence;

export const selectWorkstyleProfileEnergy = (state: RootState) =>
  state.workstyleProfileProjection.energy;

export const selectWorkstyleProfileMomentum = (state: RootState) =>
  state.workstyleProfileProjection.momentum;

export const selectWorkstyleProfileFriction = (state: RootState) =>
  state.workstyleProfileProjection.friction;

export const selectAssignedPetId = (state: RootState) =>
  state.workstyleProfileProjection.assignedPetId;

export const selectWorkstyleProfileConnectionState = (state: RootState) =>
  state.workstyleProfileProjection.connectionState;

export const selectWorkstyleProfileDisconnected = (state: RootState) =>
  state.workstyleProfileProjection.connectionState === 'disconnected';
