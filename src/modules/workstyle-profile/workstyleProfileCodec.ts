import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  cloneWorkstyleProfileValue,
  createDefaultWorkstyleProfileValue,
  ENERGY_LEVELS,
  FRICTION_LEVELS,
  MOMENTUM_LEVELS,
  PREFERRED_CADENCES,
  type EnergyLevel,
  type FrictionProfile,
  type MomentumLevel,
  type PreferredCadence,
  type WorkstyleProfileValue,
} from './workstyleProfileDocument';

export const WORKSTYLE_PROFILE_SCHEMA_VERSION = 1;

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

const parseWorkstyleProfileValue = (value: unknown): Result<WorkstyleProfileValue, string> => {
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
  if (value.assignedPetId !== null && typeof value.assignedPetId !== 'string') {
    return { ok: false, error: 'assignedPetId must be a string or null' };
  }
  if (typeof value.onboardingCompleted !== 'boolean') {
    return { ok: false, error: 'onboardingCompleted must be a boolean' };
  }
  return {
    ok: true,
    value: {
      preferredCadence: value.preferredCadence as PreferredCadence,
      energy: value.energy as EnergyLevel,
      momentum: value.momentum as MomentumLevel,
      friction: friction.value,
      assignedPetId: value.assignedPetId === null ? null : String(value.assignedPetId),
      onboardingCompleted: value.onboardingCompleted,
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
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Workstyle Profile schema version ${wire.schemaVersion}`,
        },
      };
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
    const value = parseWorkstyleProfileValue(wire.value);
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
        schemaVersion: wire.schemaVersion,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
