import { createAction } from '@reduxjs/toolkit';
import type {
  EnergyLevel,
  FrictionProfile,
  MomentumLevel,
  PreferredCadence,
} from '@/modules/workstyle-profile';
import type { WorkstyleProfileConnectionState } from '../reducers/workstyleProfileProjectionReducer';

export const setWorkstyleProfileProjection = createAction<{
  revision: number;
  preferredCadence: PreferredCadence;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  friction: FrictionProfile;
  ownedPetIds: readonly string[];
  activePetId: string | null;
  onboardingCompleted: boolean;
}>('workstyleProfileProjection/setProjection');

export const setWorkstyleProfileConnectionState = createAction<WorkstyleProfileConnectionState>(
  'workstyleProfileProjection/setConnectionState'
);
