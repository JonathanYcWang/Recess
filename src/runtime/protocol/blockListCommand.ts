import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';

export type BlockListCommand =
  | { kind: 'add-entry'; input: unknown }
  | { kind: 'remove-entry'; hostname: unknown };

export type BlockListCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | { kind: 'invalid-entry-input' }
  | { kind: 'duplicate-entry'; hostname: string }
  | { kind: 'entry-not-found'; hostname: string }
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime' };

export type BlockListCommandEnvelope = RuntimeCommandEnvelope<BlockListCommand>;

export const decodeBlockListCommandEnvelope = (
  envelope: unknown
): { ok: true; value: BlockListCommandEnvelope } | { ok: false; error: BlockListCommandError } => {
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
  if (candidate.module !== 'block-list') {
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
  if (command.kind === 'add-entry') {
    return {
      ok: true,
      value: {
        protocolVersion: candidate.protocolVersion,
        commandId: candidate.commandId,
        module: 'block-list',
        expectedRevision: candidate.expectedRevision,
        command: { kind: 'add-entry', input: command.input },
      },
    };
  }
  if (command.kind === 'remove-entry') {
    return {
      ok: true,
      value: {
        protocolVersion: candidate.protocolVersion,
        commandId: candidate.commandId,
        module: 'block-list',
        expectedRevision: candidate.expectedRevision,
        command: { kind: 'remove-entry', hostname: command.hostname },
      },
    };
  }

  return {
    ok: false,
    error: { kind: 'malformed-command', message: 'unsupported Block List command kind' },
  };
};
