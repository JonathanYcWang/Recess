import type { RuntimeCommandEnvelope } from './types';
import { RUNTIME_PROTOCOL_VERSION } from './types';

/** No mutable settings commands are implemented yet. */
export type SettingsCommand = {
  kind: string;
};

export type SettingsCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime'; diagnosticId: string };

export type SettingsCommandEnvelope = RuntimeCommandEnvelope<SettingsCommand>;

export const decodeSettingsCommandEnvelope = (
  envelope: unknown
): { ok: true; value: SettingsCommandEnvelope } | { ok: false; error: SettingsCommandError } => {
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
  if (candidate.module !== 'settings') {
    return {
      ok: false,
      error: { kind: 'invalid-module', module: String(candidate.module) },
    };
  }

  return {
    ok: false,
    error: { kind: 'malformed-command', message: 'unsupported Settings command kind' },
  };
};
