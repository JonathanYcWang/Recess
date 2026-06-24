import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  createDefaultWorkSessionStreakValue,
  type WorkSessionStreakValue,
} from './workSessionStreakDocument';

export const WORK_SESSION_STREAK_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseValue = (value: unknown): Result<WorkSessionStreakValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'work session streak value must be an object' };
  }
  if (typeof value.count !== 'number' || !Number.isInteger(value.count) || value.count < 0) {
    return { ok: false, error: 'count must be a non-negative integer' };
  }
  if (!Array.isArray(value.processedLogicalOutcomeIds)) {
    return { ok: false, error: 'processedLogicalOutcomeIds must be an array' };
  }
  const processedLogicalOutcomeIds: string[] = [];
  for (const entry of value.processedLogicalOutcomeIds) {
    if (typeof entry !== 'string' || entry.length === 0) {
      return { ok: false, error: 'processedLogicalOutcomeIds entries must be non-empty strings' };
    }
    processedLogicalOutcomeIds.push(entry);
  }
  return { ok: true, value: { count: value.count, processedLogicalOutcomeIds } };
};

export const workSessionStreakCodec: DocumentCodec<WorkSessionStreakValue> = {
  schemaVersion: WORK_SESSION_STREAK_SCHEMA_VERSION,

  createDefault(): VersionedDocument<WorkSessionStreakValue> {
    return {
      schemaVersion: WORK_SESSION_STREAK_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultWorkSessionStreakValue(),
    };
  },

  encode(document: VersionedDocument<WorkSessionStreakValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: document.value,
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Work Session Streak document must be an object',
        },
      };
    }
    if (wire.schemaVersion !== WORK_SESSION_STREAK_SCHEMA_VERSION) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Work Session Streak schema version ${wire.schemaVersion}`,
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
    const value = parseValue(wire.value);
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
        schemaVersion: WORK_SESSION_STREAK_SCHEMA_VERSION,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
