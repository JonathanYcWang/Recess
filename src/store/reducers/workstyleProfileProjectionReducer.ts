import { createReducer } from '@reduxjs/toolkit';
import {
  setWorkstyleProfileConnectionState,
  setWorkstyleProfileProjection,
} from '../actions/workstyleProfileProjectionActions';
import type {
  EnergyLevel,
  FrictionProfile,
  MomentumLevel,
  PreferredCadence,
} from '@/modules/workstyle-profile';
import { createDefaultWorkstyleProfileValue } from '@/modules/workstyle-profile';

export type WorkstyleProfileConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface WorkstyleProfileProjectionState {
  revision: number | null;
  preferredCadence: PreferredCadence;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  friction: FrictionProfile;
  assignedPetId: string | null;
  onboardingCompleted: boolean;
  connectionState: WorkstyleProfileConnectionState;
}

const defaults = createDefaultWorkstyleProfileValue();

const initialState: WorkstyleProfileProjectionState = {
  revision: null,
  preferredCadence: defaults.preferredCadence,
  energy: defaults.energy,
  momentum: defaults.momentum,
  friction: { ...defaults.friction },
  assignedPetId: defaults.assignedPetId,
  onboardingCompleted: defaults.onboardingCompleted,
  connectionState: 'connecting',
};

const workstyleProfileProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setWorkstyleProfileProjection, (state, action) => {
      state.revision = action.payload.revision;
      state.preferredCadence = action.payload.preferredCadence;
      state.energy = action.payload.energy;
      state.momentum = action.payload.momentum;
      state.friction = { ...action.payload.friction };
      state.assignedPetId = action.payload.assignedPetId;
      state.onboardingCompleted = action.payload.onboardingCompleted;
      state.connectionState = 'connected';
    })
    .addCase(setWorkstyleProfileConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default workstyleProfileProjectionReducer;
