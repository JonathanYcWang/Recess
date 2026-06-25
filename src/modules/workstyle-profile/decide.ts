import type { Result } from '@/modules/persisted-application-state/types';
import { getPetById, resolvePetIdFromQuizOutcome } from '@/modules/pet-catalog';
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
  type FrictionProfile,
  type MomentumLevel,
  type PersonalizationQuizOutcome,
  type PreferredCadence,
  type WorkstyleProfileValue,
  withActivePet,
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
  | { kind: 'assign-pet'; petId: unknown }
  | { kind: 'enrich-friction-from-personalization-quiz'; friction: unknown }
  | { kind: 'complete-personalization-quiz'; outcome: unknown }
  | { kind: 'restore-friction-baseline'; friction: unknown };

export type WorkstyleProfileDecisionError =
  | { kind: 'invalid-energy' }
  | { kind: 'invalid-momentum' }
  | { kind: 'invalid-cadence' }
  | { kind: 'invalid-friction-dimension' }
  | { kind: 'invalid-friction-level' }
  | { kind: 'invalid-primary-friction' }
  | { kind: 'invalid-pet-id' }
  | { kind: 'invalid-friction-profile' }
  | { kind: 'invalid-personalization-quiz-outcome' }
  | { kind: 'onboarding-incomplete' }
  | { kind: 'invalid-pet-mapping' };

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

const parseFrictionProfile = (
  value: unknown
): Result<FrictionProfile, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, error: { kind: 'invalid-friction-profile' } };
  }
  const candidate = value as Record<string, unknown>;
  const fields = [
    ['emotionalLoad', candidate.emotionalLoad],
    ['motivation', candidate.motivation],
    ['organization', candidate.organization],
    ['distraction', candidate.distraction],
    ['starting', candidate.starting],
    ['fatigue', candidate.fatigue],
  ] as const;
  const friction = {} as FrictionProfile;
  for (const [field, level] of fields) {
    if (typeof level !== 'string' || !includes(FRICTION_LEVELS, level)) {
      return { ok: false, error: { kind: 'invalid-friction-profile' } };
    }
    friction[field] = level;
  }
  return { ok: true, value: friction };
};

const parsePersonalizationQuizOutcome = (
  value: unknown
): Result<PersonalizationQuizOutcome, WorkstyleProfileDecisionError> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, error: { kind: 'invalid-personalization-quiz-outcome' } };
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.kind === 'balanced') {
    return { ok: true, value: { kind: 'balanced' } };
  }
  if (candidate.kind !== 'top-two' || !Array.isArray(candidate.dimensions)) {
    return { ok: false, error: { kind: 'invalid-personalization-quiz-outcome' } };
  }
  const [first, second] = candidate.dimensions;
  if (
    typeof first !== 'string' ||
    typeof second !== 'string' ||
    !includes(FRICTION_DIMENSIONS, first) ||
    !includes(FRICTION_DIMENSIONS, second) ||
    first === second
  ) {
    return { ok: false, error: { kind: 'invalid-personalization-quiz-outcome' } };
  }
  const dimensions = (first < second ? [first, second] : [second, first]) as readonly [
    FrictionDimension,
    FrictionDimension,
  ];
  return { ok: true, value: { kind: 'top-two', dimensions } };
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
      const petId = parsePetId(command.petId);
      if (!petId.ok) {
        return petId;
      }
      if (!getPetById(petId.value)) {
        return { ok: false, error: { kind: 'invalid-pet-mapping' } };
      }
      return { ok: true, value: withActivePet(next, petId.value) };
    }
    case 'enrich-friction-from-personalization-quiz': {
      if (!current.onboardingCompleted) {
        return { ok: false, error: { kind: 'onboarding-incomplete' } };
      }
      const friction = parseFrictionProfile(command.friction);
      if (!friction.ok) {
        return friction;
      }
      next.friction = cloneFrictionProfile(friction.value);
      return { ok: true, value: next };
    }
    case 'complete-personalization-quiz': {
      if (!current.onboardingCompleted) {
        return { ok: false, error: { kind: 'onboarding-incomplete' } };
      }
      const outcome = parsePersonalizationQuizOutcome(command.outcome);
      if (!outcome.ok) {
        return outcome;
      }
      next.personalizationQuizOutcome = outcome.value;
      const petId = resolvePetIdFromQuizOutcome(outcome.value);
      if (!petId || !getPetById(petId)) {
        return { ok: false, error: { kind: 'invalid-pet-mapping' } };
      }
      return { ok: true, value: withActivePet(next, petId) };
    }
    case 'restore-friction-baseline': {
      if (!current.onboardingCompleted) {
        return { ok: false, error: { kind: 'onboarding-incomplete' } };
      }
      const friction = parseFrictionProfile(command.friction);
      if (!friction.ok) {
        return friction;
      }
      next.friction = cloneFrictionProfile(friction.value);
      return { ok: true, value: next };
    }
  }
};
