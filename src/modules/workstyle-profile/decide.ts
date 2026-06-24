import type { Result } from '@/modules/persisted-application-state/types';
import {
  cloneFrictionProfile,
  cloneWorkstyleProfileValue,
  ENERGY_LEVELS,
  FRICTION_DIMENSIONS,
  FRICTION_LEVELS,
  frictionDimensionToField,
  MOMENTUM_LEVELS,
  PREFERRED_CADENCES,
  type EnergyLevel,
  type FrictionDimension,
  type FrictionLevel,
  type MomentumLevel,
  type PreferredCadence,
  type WorkstyleProfileValue,
} from './workstyleProfileDocument';

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

export type WorkstyleProfileCommand =
  | { kind: 'update-energy'; energy: unknown }
  | { kind: 'update-momentum'; momentum: unknown }
  | { kind: 'update-preferred-cadence'; cadence: unknown }
  | { kind: 'update-friction'; dimension: unknown; level: unknown }
  | {
      kind: 'initialize-from-onboarding';
      energy: unknown;
      cadence: unknown;
      primaryFriction: unknown;
    }
  | { kind: 'assign-pet'; petId: unknown };

export type WorkstyleProfileDecisionError =
  | { kind: 'invalid-energy' }
  | { kind: 'invalid-momentum' }
  | { kind: 'invalid-cadence' }
  | { kind: 'invalid-friction-dimension' }
  | { kind: 'invalid-friction-level' }
  | { kind: 'invalid-primary-friction' }
  | { kind: 'invalid-pet-id' }
  | { kind: 'pet-already-assigned'; existingPetId: string };

const parseEnergy = (value: unknown): Result<EnergyLevel, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'string' || !includes(ENERGY_LEVELS, value)) {
    return { ok: false, error: { kind: 'invalid-energy' } };
  }
  return { ok: true, value };
};

const parseMomentum = (value: unknown): Result<MomentumLevel, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'string' || !includes(MOMENTUM_LEVELS, value)) {
    return { ok: false, error: { kind: 'invalid-momentum' } };
  }
  return { ok: true, value };
};

const parseCadence = (value: unknown): Result<PreferredCadence, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'string' || !includes(PREFERRED_CADENCES, value)) {
    return { ok: false, error: { kind: 'invalid-cadence' } };
  }
  return { ok: true, value };
};

const parseFrictionDimension = (
  value: unknown
): Result<FrictionDimension, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'string' || !includes(FRICTION_DIMENSIONS, value)) {
    return { ok: false, error: { kind: 'invalid-friction-dimension' } };
  }
  return { ok: true, value };
};

const parseFrictionLevel = (
  value: unknown
): Result<FrictionLevel, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'string' || !includes(FRICTION_LEVELS, value)) {
    return { ok: false, error: { kind: 'invalid-friction-level' } };
  }
  return { ok: true, value };
};

const parsePrimaryFriction = (
  value: unknown
): Result<FrictionDimension, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'string' || !includes(FRICTION_DIMENSIONS, value)) {
    return { ok: false, error: { kind: 'invalid-primary-friction' } };
  }
  return { ok: true, value };
};

const parsePetId = (value: unknown): Result<string, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error: { kind: 'invalid-pet-id' } };
  }
  return { ok: true, value: value.trim() };
};

export const applyWorkstyleProfileCommand = (
  current: WorkstyleProfileValue,
  command: WorkstyleProfileCommand
): Result<WorkstyleProfileValue, WorkstyleProfileDecisionError> => {
  const next = cloneWorkstyleProfileValue(current);

  switch (command.kind) {
    case 'update-energy': {
      const energy = parseEnergy(command.energy);
      if (!energy.ok) {
        return energy;
      }
      next.energy = energy.value;
      return { ok: true, value: next };
    }
    case 'update-momentum': {
      const momentum = parseMomentum(command.momentum);
      if (!momentum.ok) {
        return momentum;
      }
      next.momentum = momentum.value;
      return { ok: true, value: next };
    }
    case 'update-preferred-cadence': {
      const cadence = parseCadence(command.cadence);
      if (!cadence.ok) {
        return cadence;
      }
      next.preferredCadence = cadence.value;
      return { ok: true, value: next };
    }
    case 'update-friction': {
      const dimension = parseFrictionDimension(command.dimension);
      if (!dimension.ok) {
        return dimension;
      }
      const level = parseFrictionLevel(command.level);
      if (!level.ok) {
        return level;
      }
      const field = frictionDimensionToField(dimension.value);
      next.friction = {
        ...cloneFrictionProfile(next.friction),
        [field]: level.value,
      };
      return { ok: true, value: next };
    }
    case 'initialize-from-onboarding': {
      const energy = parseEnergy(command.energy);
      if (!energy.ok) {
        return energy;
      }
      const cadence = parseCadence(command.cadence);
      if (!cadence.ok) {
        return cadence;
      }
      const primaryFriction = parsePrimaryFriction(command.primaryFriction);
      if (!primaryFriction.ok) {
        return primaryFriction;
      }
      next.energy = energy.value;
      next.preferredCadence = cadence.value;
      next.momentum = 'steady';
      next.friction = { ...cloneFrictionProfile(next.friction) };
      const field = frictionDimensionToField(primaryFriction.value);
      next.friction[field] = 'high';
      next.onboardingCompleted = true;
      return { ok: true, value: next };
    }
    case 'assign-pet': {
      if (current.assignedPetId !== null) {
        return {
          ok: false,
          error: { kind: 'pet-already-assigned', existingPetId: current.assignedPetId },
        };
      }
      const petId = parsePetId(command.petId);
      if (!petId.ok) {
        return petId;
      }
      next.assignedPetId = petId.value;
      return { ok: true, value: next };
    }
  }
};
