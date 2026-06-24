import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  cloneHallPassValue,
  createDefaultHallPassValue,
  type HallPassValue,
} from './hallPassDocument';

export const HALL_PASS_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parsePendingRequest = (
  value: unknown
): Result<NonNullable<HallPassValue['pendingRequest']>, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'pending request must be an object' };
  }
  if (typeof value.requestId !== 'string' || value.requestId.length === 0) {
    return { ok: false, error: 'pending requestId must be a non-empty string' };
  }
  if (typeof value.destination !== 'string' || value.destination.length === 0) {
    return { ok: false, error: 'pending destination must be a non-empty string' };
  }
  if (typeof value.rememberedUrl !== 'string' || value.rememberedUrl.length === 0) {
    return { ok: false, error: 'pending rememberedUrl must be a non-empty string' };
  }
  if (typeof value.reportedAtEpochMs !== 'number' || !Number.isFinite(value.reportedAtEpochMs)) {
    return { ok: false, error: 'pending reportedAtEpochMs must be finite' };
  }
  return {
    ok: true,
    value: {
      requestId: value.requestId,
      destination: value.destination,
      rememberedUrl: value.rememberedUrl,
      reportedAtEpochMs: value.reportedAtEpochMs,
    },
  };
};

const parseActivePass = (
  value: unknown
): Result<NonNullable<HallPassValue['activePass']>, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'active pass must be an object' };
  }
  if (typeof value.passId !== 'string' || value.passId.length === 0) {
    return { ok: false, error: 'active passId must be a non-empty string' };
  }
  if (typeof value.destination !== 'string' || value.destination.length === 0) {
    return { ok: false, error: 'active destination must be a non-empty string' };
  }
  if (typeof value.grantedAtEpochMs !== 'number' || !Number.isFinite(value.grantedAtEpochMs)) {
    return { ok: false, error: 'active grantedAtEpochMs must be finite' };
  }
  if (
    typeof value.activeSecondsAccumulated !== 'number' ||
    !Number.isInteger(value.activeSecondsAccumulated) ||
    value.activeSecondsAccumulated < 0
  ) {
    return { ok: false, error: 'activeSecondsAccumulated must be a non-negative integer' };
  }
  if (
    typeof value.billedMinuteCount !== 'number' ||
    !Number.isInteger(value.billedMinuteCount) ||
    value.billedMinuteCount < 0
  ) {
    return { ok: false, error: 'billedMinuteCount must be a non-negative integer' };
  }
  if (
    value.meterAnchorEpochMs !== null &&
    (typeof value.meterAnchorEpochMs !== 'number' || !Number.isFinite(value.meterAnchorEpochMs))
  ) {
    return { ok: false, error: 'meterAnchorEpochMs must be null or finite' };
  }
  if (typeof value.isMeteringActive !== 'boolean') {
    return { ok: false, error: 'isMeteringActive must be a boolean' };
  }
  return {
    ok: true,
    value: {
      passId: value.passId,
      destination: value.destination,
      grantedAtEpochMs: value.grantedAtEpochMs,
      activeSecondsAccumulated: value.activeSecondsAccumulated,
      billedMinuteCount: value.billedMinuteCount,
      meterAnchorEpochMs: value.meterAnchorEpochMs,
      isMeteringActive: value.isMeteringActive,
    },
  };
};

const parseHallPassValue = (value: unknown): Result<HallPassValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'hall pass value must be an object' };
  }
  let pendingRequest: HallPassValue['pendingRequest'] = null;
  if (value.pendingRequest !== null && value.pendingRequest !== undefined) {
    const parsed = parsePendingRequest(value.pendingRequest);
    if (!parsed.ok) {
      return parsed;
    }
    pendingRequest = parsed.value;
  }
  let activePass: HallPassValue['activePass'] = null;
  if (value.activePass !== null && value.activePass !== undefined) {
    const parsed = parseActivePass(value.activePass);
    if (!parsed.ok) {
      return parsed;
    }
    activePass = parsed.value;
  }
  return { ok: true, value: { pendingRequest, activePass } };
};

export const hallPassCodec: DocumentCodec<HallPassValue> = {
  schemaVersion: HALL_PASS_SCHEMA_VERSION,

  createDefault(): VersionedDocument<HallPassValue> {
    return {
      schemaVersion: HALL_PASS_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultHallPassValue(),
    };
  },

  encode(document: VersionedDocument<HallPassValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: cloneHallPassValue(document.value),
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Hall pass document must be an object',
        },
      };
    }
    if (wire.schemaVersion !== HALL_PASS_SCHEMA_VERSION) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Hall pass schema version ${String(wire.schemaVersion)}`,
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
    const value = parseHallPassValue(wire.value);
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
