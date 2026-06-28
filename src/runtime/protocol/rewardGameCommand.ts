import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';
import type { RewardGameDecisionError } from '@/modules/reward-game';

export type RewardGameRuntimeCommand =
  | {
      kind: 'start-round';
      sessionId: unknown;
      roundId: unknown;
      destinations: unknown;
      randomDraws: unknown;
      nowEpochMs: unknown;
      scheduledKind?: unknown;
    }
  | { kind: 'choose-candidate'; roundId: unknown; candidateIndex: unknown; nowEpochMs: unknown }
  | { kind: 'trigger-resolution'; roundId: unknown; randomValue: unknown; nowEpochMs: unknown }
  | { kind: 'resolve-deadline'; roundId: unknown; randomValue: unknown; nowEpochMs: unknown }
  | { kind: 'complete-round'; roundId: unknown }
  | {
      kind: 'reroll';
      roundId: unknown;
      destinations: unknown;
      randomDraws: unknown;
      nowEpochMs: unknown;
      coinBalance: unknown;
      paid: unknown;
      remainingRecessBudgetSeconds: unknown;
    };

export type RewardGameCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | RewardGameDecisionError
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime' };

export type RewardGameCommandEnvelope = RuntimeCommandEnvelope<RewardGameRuntimeCommand>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseCommand = (command: unknown): RewardGameRuntimeCommand | null => {
  if (!isRecord(command) || typeof command.kind !== 'string') {
    return null;
  }
  switch (command.kind) {
    case 'start-round':
      return {
        kind: 'start-round',
        sessionId: command.sessionId,
        roundId: command.roundId,
        destinations: command.destinations,
        randomDraws: command.randomDraws,
        nowEpochMs: command.nowEpochMs,
        scheduledKind: command.scheduledKind,
      };
    case 'choose-candidate':
      return {
        kind: 'choose-candidate',
        roundId: command.roundId,
        candidateIndex: command.candidateIndex,
        nowEpochMs: command.nowEpochMs,
      };
    case 'trigger-resolution':
      return {
        kind: 'trigger-resolution',
        roundId: command.roundId,
        randomValue: command.randomValue,
        nowEpochMs: command.nowEpochMs,
      };
    case 'resolve-deadline':
      return {
        kind: 'resolve-deadline',
        roundId: command.roundId,
        randomValue: command.randomValue,
        nowEpochMs: command.nowEpochMs,
      };
    case 'complete-round':
      return { kind: 'complete-round', roundId: command.roundId };
    case 'reroll':
      return {
        kind: 'reroll',
        roundId: command.roundId,
        destinations: command.destinations,
        randomDraws: command.randomDraws,
        nowEpochMs: command.nowEpochMs,
        coinBalance: command.coinBalance,
        paid: command.paid,
        remainingRecessBudgetSeconds: command.remainingRecessBudgetSeconds,
      };
    default:
      return null;
  }
};

export const decodeRewardGameCommandEnvelope = (
  envelope: unknown
):
  | { ok: true; value: RewardGameCommandEnvelope }
  | { ok: false; error: RewardGameCommandError } => {
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
  if (candidate.module !== 'reward-game') {
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
      error: { kind: 'malformed-command', message: 'unsupported Reward Game command kind' },
    };
  }

  return {
    ok: true,
    value: {
      protocolVersion: candidate.protocolVersion,
      commandId: candidate.commandId,
      module: 'reward-game',
      expectedRevision: candidate.expectedRevision,
      command,
    },
  };
};
