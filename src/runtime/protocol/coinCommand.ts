import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';
import type { CoinDecisionError } from '@/modules/coin';

export type CoinCommand =
  | {
      kind: 'credit';
      transactionId: unknown;
      amount: unknown;
      recordedAt: unknown;
      reasonCode: unknown;
      context?: unknown;
    }
  | {
      kind: 'debit';
      transactionId: unknown;
      amount: unknown;
      recordedAt: unknown;
      reasonCode: unknown;
      context?: unknown;
    };

export type CoinCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | CoinDecisionError
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime' };

export type CoinCommandEnvelope = RuntimeCommandEnvelope<CoinCommand>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseCommand = (command: unknown): CoinCommand | null => {
  if (!isRecord(command) || typeof command.kind !== 'string') {
    return null;
  }
  if (command.kind === 'credit' || command.kind === 'debit') {
    return {
      kind: command.kind,
      transactionId: command.transactionId,
      amount: command.amount,
      recordedAt: command.recordedAt,
      reasonCode: command.reasonCode,
      context: command.context,
    };
  }
  return null;
};

export const decodeCoinCommandEnvelope = (
  envelope: unknown
): { ok: true; value: CoinCommandEnvelope } | { ok: false; error: CoinCommandError } => {
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
  if (candidate.module !== 'coin') {
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

  const command = parseCommand(candidate.command);
  if (!command) {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'unsupported Coin command kind' },
    };
  }

  return {
    ok: true,
    value: {
      protocolVersion: candidate.protocolVersion,
      commandId: candidate.commandId,
      module: 'coin',
      expectedRevision: candidate.expectedRevision,
      command,
    },
  };
};
