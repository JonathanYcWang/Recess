import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';

export type HallPassCommand =
  | { kind: 'report-blocked-attempt'; url: unknown; requestId: unknown; reportedAtEpochMs: unknown }
  | { kind: 'confirm-grant'; requestId: unknown; passId: unknown; grantedAtEpochMs: unknown }
  | { kind: 'cancel-pending'; requestId?: unknown };

export type HallPassCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | { kind: 'not-in-time-out' }
  | { kind: 'destination-not-blocked' }
  | { kind: 'private-or-unsupported-destination' }
  | { kind: 'zero-balance' }
  | { kind: 'no-pending-request' }
  | { kind: 'stale-pending-request'; requestId: string }
  | { kind: 'no-active-pass' }
  | { kind: 'stale-pass'; passId: string }
  | { kind: 'entry-removed'; destination: string }
  | { kind: 'invalid-destination' }
  | { kind: 'invalid-request-id' }
  | { kind: 'invalid-pass-id' }
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime'; diagnosticId: string };

export type HallPassCommandEnvelope = RuntimeCommandEnvelope<HallPassCommand>;

const mapDecisionError = (
  error: import('@/modules/hall-pass').HallPassDecisionError
): HallPassCommandError => {
  switch (error.kind) {
    case 'not-in-time-out':
    case 'destination-not-blocked':
    case 'private-or-unsupported-destination':
    case 'zero-balance':
    case 'no-pending-request':
    case 'stale-pending-request':
    case 'no-active-pass':
    case 'stale-pass':
    case 'entry-removed':
    case 'invalid-destination':
    case 'invalid-request-id':
    case 'invalid-pass-id':
      return error;
    default: {
      const exhaustive: never = error;
      return exhaustive;
    }
  }
};

export const decodeHallPassCommandEnvelope = (
  envelope: unknown
): { ok: true; value: HallPassCommandEnvelope } | { ok: false; error: HallPassCommandError } => {
  if (!envelope || typeof envelope !== 'object') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'envelope must be an object' },
    };
  }

  const candidate = envelope as Record<string, unknown>;

  if (typeof candidate.protocolVersion !== 'number') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'protocolVersion must be a number' },
    };
  }
  if (candidate.protocolVersion !== RUNTIME_PROTOCOL_VERSION) {
    return {
      ok: false,
      error: { kind: 'unsupported-protocol', supportedVersion: RUNTIME_PROTOCOL_VERSION },
    };
  }
  if (typeof candidate.commandId !== 'string' || candidate.commandId.length === 0) {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'commandId must be a non-empty string' },
    };
  }
  if (candidate.module !== 'hall-pass') {
    return {
      ok: false,
      error: { kind: 'invalid-module', module: String(candidate.module) },
    };
  }
  if (
    candidate.expectedRevision !== undefined &&
    (typeof candidate.expectedRevision !== 'number' ||
      !Number.isInteger(candidate.expectedRevision) ||
      candidate.expectedRevision < 0)
  ) {
    return {
      ok: false,
      error: {
        kind: 'malformed-command',
        message: 'expectedRevision must be a non-negative integer',
      },
    };
  }
  if (!candidate.command || typeof candidate.command !== 'object') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'command must be an object' },
    };
  }

  const command = candidate.command as Record<string, unknown>;
  const base = {
    protocolVersion: candidate.protocolVersion,
    commandId: candidate.commandId,
    module: 'hall-pass' as const,
    expectedRevision: candidate.expectedRevision,
  };

  switch (command.kind) {
    case 'report-blocked-attempt':
      return {
        ok: true,
        value: {
          ...base,
          command: {
            kind: 'report-blocked-attempt',
            url: command.url,
            requestId: command.requestId,
            reportedAtEpochMs: command.reportedAtEpochMs,
          },
        },
      };
    case 'confirm-grant':
      return {
        ok: true,
        value: {
          ...base,
          command: {
            kind: 'confirm-grant',
            requestId: command.requestId,
            passId: command.passId,
            grantedAtEpochMs: command.grantedAtEpochMs,
          },
        },
      };
    case 'cancel-pending':
      return {
        ok: true,
        value: {
          ...base,
          command: { kind: 'cancel-pending', requestId: command.requestId },
        },
      };
    default:
      return {
        ok: false,
        error: { kind: 'malformed-command', message: 'unsupported Hall Pass command kind' },
      };
  }
};

export { mapDecisionError };
