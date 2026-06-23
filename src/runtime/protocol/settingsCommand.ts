import { THEME_PREFERENCES, type ThemePreference } from '@/modules/persisted-application-state';
import type { RuntimeCommandEnvelope } from './types';
import { RUNTIME_PROTOCOL_VERSION } from './types';

export type SettingsCommand = {
  kind: 'set-theme-preference';
  preference: unknown;
};

export type SettingsCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | { kind: 'invalid-theme-preference' }
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime'; diagnosticId: string };

export type SettingsCommandEnvelope = RuntimeCommandEnvelope<SettingsCommand>;

export const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && THEME_PREFERENCES.some((preference) => preference === value);

export const decodeSettingsCommandEnvelope = (
  envelope: unknown
):
  | { ok: true; value: SettingsCommandEnvelope }
  | { ok: false; error: SettingsCommandError } => {
  if (!envelope || typeof envelope !== 'object') {
    return { ok: false, error: { kind: 'malformed-command', message: 'envelope must be an object' } };
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
  if (
    candidate.expectedRevision !== undefined &&
    (typeof candidate.expectedRevision !== 'number' ||
      !Number.isInteger(candidate.expectedRevision) ||
      candidate.expectedRevision < 0)
  ) {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'expectedRevision must be a non-negative integer' },
    };
  }
  if (!candidate.command || typeof candidate.command !== 'object') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'command must be an object' },
    };
  }

  const command = candidate.command as Record<string, unknown>;
  if (command.kind !== 'set-theme-preference') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'unsupported Settings command kind' },
    };
  }

  return {
    ok: true,
    value: {
      protocolVersion: candidate.protocolVersion,
      commandId: candidate.commandId,
      module: 'settings',
      expectedRevision: candidate.expectedRevision,
      command: {
        kind: 'set-theme-preference',
        preference: command.preference,
      },
    },
  };
};
