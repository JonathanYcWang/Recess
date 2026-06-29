import type { DocumentCodec, Result, VersionedDocument } from '@/runtime/persistence';
import type { RewardGameKind } from '@/modules/scheduler';
import {
  cloneRewardGameValue,
  createDefaultRewardGameValue,
  type RewardGameResolutionKind,
  type RewardGameValue,
} from './rewardGameDocument';

export const REWARD_GAME_SCHEMA_VERSION = 1;

const REWARD_GAME_KINDS = ['cards', 'wheel', 'slots'] as const satisfies readonly RewardGameKind[];
const RESOLUTION_KINDS = [
  'choice',
  'timeout',
  'trigger',
] as const satisfies readonly RewardGameResolutionKind[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

const parseCandidates = (value: unknown): Result<readonly string[], string> => {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'candidates must be an array' };
  }
  const candidates: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      return { ok: false, error: 'candidate must be a non-empty string' };
    }
    candidates.push(entry.trim().toLowerCase());
  }
  return { ok: true, value: candidates };
};

const parseRewardGameValue = (value: unknown): Result<RewardGameValue, string> => {
  if (!isRecord(value) || typeof value.phase !== 'string') {
    return { ok: false, error: 'reward game value must be an object with phase' };
  }
  if (
    typeof value.nextGameIndex !== 'number' ||
    !Number.isInteger(value.nextGameIndex) ||
    value.nextGameIndex < 0
  ) {
    return { ok: false, error: 'nextGameIndex must be a non-negative integer' };
  }

  if (value.phase === 'idle') {
    return { ok: true, value: { phase: 'idle', nextGameIndex: value.nextGameIndex } };
  }

  if (typeof value.roundId !== 'string' || value.roundId.length === 0) {
    return { ok: false, error: 'roundId must be a non-empty string' };
  }
  if (typeof value.sessionId !== 'string' || value.sessionId.length === 0) {
    return { ok: false, error: 'sessionId must be a non-empty string' };
  }
  if (typeof value.kind !== 'string' || !includes(REWARD_GAME_KINDS, value.kind)) {
    return { ok: false, error: 'kind must be cards, wheel, or slots' };
  }
  const candidates = parseCandidates(value.candidates);
  if (!candidates.ok) {
    return { ok: false, error: candidates.error };
  }
  if (
    typeof value.freeRerollsRemaining !== 'number' ||
    !Number.isInteger(value.freeRerollsRemaining) ||
    value.freeRerollsRemaining < 0
  ) {
    return { ok: false, error: 'freeRerollsRemaining must be a non-negative integer' };
  }

  if (
    typeof value.candidateSnapshotRevision !== 'number' ||
    !Number.isInteger(value.candidateSnapshotRevision) ||
    value.candidateSnapshotRevision < 1
  ) {
    return { ok: false, error: 'candidateSnapshotRevision must be a positive integer' };
  }

  if (value.phase === 'active-round') {
    if (
      typeof value.decisionDeadlineEpochMs !== 'number' ||
      !Number.isFinite(value.decisionDeadlineEpochMs)
    ) {
      return { ok: false, error: 'decisionDeadlineEpochMs must be a finite number' };
    }
    if (typeof value.startedAtEpochMs !== 'number' || !Number.isFinite(value.startedAtEpochMs)) {
      return { ok: false, error: 'startedAtEpochMs must be a finite number' };
    }
    return {
      ok: true,
      value: {
        phase: 'active-round',
        nextGameIndex: value.nextGameIndex,
        roundId: value.roundId,
        sessionId: value.sessionId,
        kind: value.kind,
        candidates: candidates.value,
        candidateSnapshotRevision: value.candidateSnapshotRevision,
        decisionDeadlineEpochMs: value.decisionDeadlineEpochMs,
        startedAtEpochMs: value.startedAtEpochMs,
        freeRerollsRemaining: value.freeRerollsRemaining,
      },
    };
  }

  if (value.phase === 'resolved-round') {
    if (typeof value.selectedDestination !== 'string' || value.selectedDestination.length === 0) {
      return { ok: false, error: 'selectedDestination must be a non-empty string' };
    }
    if (typeof value.resolvedAtEpochMs !== 'number' || !Number.isFinite(value.resolvedAtEpochMs)) {
      return { ok: false, error: 'resolvedAtEpochMs must be a finite number' };
    }
    if (
      typeof value.resolutionKind !== 'string' ||
      !includes(RESOLUTION_KINDS, value.resolutionKind)
    ) {
      return { ok: false, error: 'resolutionKind must be choice, timeout, or trigger' };
    }
    return {
      ok: true,
      value: {
        phase: 'resolved-round',
        nextGameIndex: value.nextGameIndex,
        roundId: value.roundId,
        sessionId: value.sessionId,
        kind: value.kind,
        candidates: candidates.value,
        selectedDestination: value.selectedDestination.trim().toLowerCase(),
        resolvedAtEpochMs: value.resolvedAtEpochMs,
        resolutionKind: value.resolutionKind,
        freeRerollsRemaining: value.freeRerollsRemaining,
        candidateSnapshotRevision: value.candidateSnapshotRevision,
      },
    };
  }

  return { ok: false, error: 'unsupported reward game phase' };
};

export const rewardGameCodec: DocumentCodec<RewardGameValue> = {
  schemaVersion: REWARD_GAME_SCHEMA_VERSION,

  createDefault(): VersionedDocument<RewardGameValue> {
    return {
      schemaVersion: REWARD_GAME_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultRewardGameValue(),
    };
  },

  encode(document: VersionedDocument<RewardGameValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: cloneRewardGameValue(document.value),
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Reward Game document must be an object',
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
    if (wire.schemaVersion !== REWARD_GAME_SCHEMA_VERSION) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Reward Game schema version ${wire.schemaVersion}`,
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
    const value = parseRewardGameValue(wire.value);
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
