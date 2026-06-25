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

export const selectActivePetId = (state: RootState) => state.workstyleProfileProjection.activePetId;

export const selectOwnedPetIds = (state: RootState) => state.workstyleProfileProjection.ownedPetIds;

export const selectOnboardingCompleted = (state: RootState) =>
  state.workstyleProfileProjection.onboardingCompleted;

export const selectWorkstyleProfileConnectionState = (state: RootState) =>
  state.workstyleProfileProjection.connectionState;

export const selectWorkstyleProfileDisconnected = (state: RootState) =>
  state.workstyleProfileProjection.connectionState === 'disconnected';
