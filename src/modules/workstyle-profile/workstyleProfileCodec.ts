import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  cloneWorkstyleProfileValue,
  createDefaultWorkstyleProfileValue,
  ENERGY_LEVELS,
  FRICTION_DIMENSIONS,
  FRICTION_LEVELS,
  MOMENTUM_LEVELS,
  PREFERRED_CADENCES,
  type EnergyLevel,
  type FrictionProfile,
  type MomentumLevel,
  type PersonalizationQuizOutcome,
  type PreferredCadence,
  type WorkstyleProfileValue,
} from './workstyleProfileDocument';
import { createDefaultPetMoodValue, type PetMoodValue } from '@/modules/pet-mood';

export const WORKSTYLE_PROFILE_SCHEMA_VERSION = 3;
const SUPPORTED_SCHEMA_VERSIONS = [1, 2, 3] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

const parseFrictionProfile = (value: unknown): Result<FrictionProfile, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'friction must be an object' };
  }
  const fields = [
    ['emotionalLoad', value.emotionalLoad],
    ['motivation', value.motivation],
    ['organization', value.organization],
    ['distraction', value.distraction],
    ['starting', value.starting],
    ['fatigue', value.fatigue],
  ] as const;
  const friction = {} as FrictionProfile;
  for (const [field, level] of fields) {
    if (typeof level !== 'string' || !includes(FRICTION_LEVELS, level)) {
      return { ok: false, error: `${field} must be a valid friction level` };
    }
    friction[field] = level;
  }
  return { ok: true, value: friction };
};

const parsePersonalizationQuizOutcome = (
  value: unknown
): Result<PersonalizationQuizOutcome | null, string> => {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }
  if (!isRecord(value)) {
    return { ok: false, error: 'personalizationQuizOutcome must be an object or null' };
  }
  if (value.kind === 'balanced') {
    return { ok: true, value: { kind: 'balanced' } };
  }
  if (value.kind !== 'top-two' || !Array.isArray(value.dimensions)) {
    return { ok: false, error: 'personalizationQuizOutcome must be balanced or top-two' };
  }
  const [first, second] = value.dimensions;
  if (
    typeof first !== 'string' ||
    typeof second !== 'string' ||
    !includes(FRICTION_DIMENSIONS, first) ||
    !includes(FRICTION_DIMENSIONS, second) ||
    first === second
  ) {
    return { ok: false, error: 'personalizationQuizOutcome dimensions must be distinct frictions' };
  }
  const dimensions = (first < second ? [first, second] : [second, first]) as readonly [
    typeof first,
    typeof second,
  ];
  return { ok: true, value: { kind: 'top-two', dimensions } };
};

const parseOwnedPetIds = (value: unknown): Result<readonly string[], string> => {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'ownedPetIds must be an array' };
  }
  const ownedPetIds: string[] = [];
  for (const petId of value) {
    if (typeof petId !== 'string' || petId.trim().length === 0) {
      return { ok: false, error: 'ownedPetIds must contain non-empty strings' };
    }
    if (!ownedPetIds.includes(petId)) {
      ownedPetIds.push(petId);
    }
  }
  return { ok: true, value: ownedPetIds };
};

const parsePetCollection = (
  value: unknown,
  schemaVersion: number
): Result<Pick<WorkstyleProfileValue, 'ownedPetIds' | 'activePetId'>, string> => {
  if (schemaVersion >= 3) {
    if (!isRecord(value)) {
      return { ok: false, error: 'workstyle profile value must be an object' };
    }
    const ownedPetIds = parseOwnedPetIds(value.ownedPetIds);
    if (!ownedPetIds.ok) {
      return ownedPetIds;
    }
    if (value.activePetId !== null && typeof value.activePetId !== 'string') {
      return { ok: false, error: 'activePetId must be a string or null' };
    }
    const activePetId = value.activePetId === null ? null : String(value.activePetId);
    if (activePetId !== null && !ownedPetIds.value.includes(activePetId)) {
      return { ok: false, error: 'activePetId must be included in ownedPetIds' };
    }
    return { ok: true, value: { ownedPetIds: ownedPetIds.value, activePetId } };
  }

  const assignedPetId =
    isRecord(value) && value.assignedPetId !== null && typeof value.assignedPetId === 'string'
      ? String(value.assignedPetId)
      : null;
  return {
    ok: true,
    value: {
      ownedPetIds: assignedPetId ? [assignedPetId] : [],
      activePetId: assignedPetId,
    },
  };
};

const parsePetMoodValue = (value: unknown, schemaVersion: number): Result<PetMoodValue, string> => {
  if (schemaVersion < 3 || value === undefined) {
    return { ok: true, value: createDefaultPetMoodValue() };
  }
  if (!isRecord(value)) {
    return { ok: false, error: 'petMood must be an object' };
  }
  const moods = ['calm', 'focused', 'curious', 'happy', 'restless', 'hungry', 'sleepy', 'sad'];
  if (typeof value.currentMood !== 'string' || !moods.includes(value.currentMood)) {
    return { ok: false, error: 'petMood.currentMood is invalid' };
  }
  if (
    typeof value.completedFocusBlocksInSession !== 'number' ||
    !Number.isInteger(value.completedFocusBlocksInSession)
  ) {
    return { ok: false, error: 'petMood.completedFocusBlocksInSession must be an integer' };
  }
  if (value.timeOutSessionId !== null && typeof value.timeOutSessionId !== 'string') {
    return { ok: false, error: 'petMood.timeOutSessionId must be a string or null' };
  }
  if (typeof value.timeOutElapsedMinutes !== 'number') {
    return { ok: false, error: 'petMood.timeOutElapsedMinutes must be a number' };
  }
  return {
    ok: true,
    value: {
      currentMood: value.currentMood as PetMoodValue['currentMood'],
      completedFocusBlocksInSession: value.completedFocusBlocksInSession,
      timeOutSessionId: value.timeOutSessionId === null ? null : String(value.timeOutSessionId),
      timeOutElapsedMinutes: value.timeOutElapsedMinutes,
    },
  };
};

const parseWorkstyleProfileValue = (
  value: unknown,
  schemaVersion: number
): Result<WorkstyleProfileValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'workstyle profile value must be an object' };
  }
  if (
    typeof value.preferredCadence !== 'string' ||
    !includes(PREFERRED_CADENCES, value.preferredCadence)
  ) {
    return { ok: false, error: 'preferredCadence must be 15/5, 25/5, or 45/10' };
  }
  if (typeof value.energy !== 'string' || !includes(ENERGY_LEVELS, value.energy)) {
    return { ok: false, error: 'energy must be low, steady, or high' };
  }
  if (typeof value.momentum !== 'string' || !includes(MOMENTUM_LEVELS, value.momentum)) {
    return { ok: false, error: 'momentum must be low, steady, building, or flowing' };
  }
  const friction = parseFrictionProfile(value.friction);
  if (!friction.ok) {
    return { ok: false, error: friction.error };
  }
  const pets = parsePetCollection(value, schemaVersion);
  if (!pets.ok) {
    return pets;
  }
  if (typeof value.onboardingCompleted !== 'boolean') {
    return { ok: false, error: 'onboardingCompleted must be a boolean' };
  }
  const outcome =
    schemaVersion >= 2
      ? parsePersonalizationQuizOutcome(value.personalizationQuizOutcome)
      : { ok: true as const, value: null };
  if (!outcome.ok) {
    return { ok: false, error: outcome.error };
  }
  const petMood = parsePetMoodValue(value.petMood, schemaVersion);
  if (!petMood.ok) {
    return { ok: false, error: petMood.error };
  }
  return {
    ok: true,
    value: {
      preferredCadence: value.preferredCadence as PreferredCadence,
      energy: value.energy as EnergyLevel,
      momentum: value.momentum as MomentumLevel,
      friction: friction.value,
      ownedPetIds: pets.value.ownedPetIds,
      activePetId: pets.value.activePetId,
      onboardingCompleted: value.onboardingCompleted,
      personalizationQuizOutcome: outcome.value,
      petMood: petMood.value,
    },
  };
};

export const workstyleProfileCodec: DocumentCodec<WorkstyleProfileValue> = {
  schemaVersion: WORKSTYLE_PROFILE_SCHEMA_VERSION,

  createDefault(): VersionedDocument<WorkstyleProfileValue> {
    return {
      schemaVersion: WORKSTYLE_PROFILE_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultWorkstyleProfileValue(),
    };
  },

  encode(document: VersionedDocument<WorkstyleProfileValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: cloneWorkstyleProfileValue(document.value),
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Workstyle Profile document must be an object',
        },
      };
    }
    if (typeof wire.schemaVersion !== 'number') {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'schemaVersion',
          message: 'schemaVersion must be a number',
        },
      };
    }
    if (wire.schemaVersion !== WORKSTYLE_PROFILE_SCHEMA_VERSION) {
      if (
        !SUPPORTED_SCHEMA_VERSIONS.includes(
          wire.schemaVersion as (typeof SUPPORTED_SCHEMA_VERSIONS)[number]
        )
      ) {
        return {
          ok: false as const,
          error: {
            kind: 'unsupported-version' as const,
            message: `Unsupported Workstyle Profile schema version ${wire.schemaVersion}`,
          },
        };
      }
    }
    if (
      typeof wire.revision !== 'number' ||
      !Number.isInteger(wire.revision) ||
      wire.revision < 0
    ) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'revision',
          message: 'revision must be a non-negative integer',
        },
      };
    }
    const value = parseWorkstyleProfileValue(wire.value, wire.schemaVersion);
    if (!value.ok) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'value',
          message: value.error,
        },
      };
    }
    return {
      ok: true as const,
      value: {
        schemaVersion: WORKSTYLE_PROFILE_SCHEMA_VERSION,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
