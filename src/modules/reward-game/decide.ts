import type { Result } from '@/modules/persisted-application-state/types';
import { GAME_BUDGET_SECONDS, type RewardGameKind } from '@/modules/scheduler';
import { resolveDestination, selectCandidates } from './candidates';
import {
  cloneRewardGameValue,
  FREE_REROLLS_PER_ROUND,
  gameKindForIndex,
  PAID_REROLL_COST,
  type RewardGameActiveRound,
  type RewardGameResolutionKind,
  type RewardGameValue,
} from './rewardGameDocument';
import { decisionDeadlineEpochMs, isDecisionDeadlineDue, maxAnimationSeconds } from './roundTiming';

const REWARD_GAME_KINDS = ['cards', 'wheel', 'slots'] as const satisfies readonly RewardGameKind[];

const includes = <T extends string>(values: readonly T[], candidate: string): candidate is T =>
  (values as readonly string[]).includes(candidate);

export type RewardGameCommand =
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

export type RewardGameDecisionError =
  | { kind: 'invalid-session-id' }
  | { kind: 'invalid-round-id' }
  | { kind: 'invalid-destinations' }
  | { kind: 'invalid-random-draws' }
  | { kind: 'invalid-now' }
  | { kind: 'invalid-candidate-index' }
  | { kind: 'invalid-random-value' }
  | { kind: 'invalid-coin-balance' }
  | { kind: 'invalid-recess-budget' }
  | { kind: 'round-already-active' }
  | { kind: 'no-active-round' }
  | { kind: 'round-id-mismatch' }
  | { kind: 'round-already-resolved' }
  | { kind: 'decision-deadline-not-due' }
  | { kind: 'decision-deadline-expired' }
  | { kind: 'unsupported-game-command' }
  | { kind: 'insufficient-coins'; balance: number; required: number }
  | { kind: 'reroll-budget-exceeded' }
  | { kind: 'no-free-rerolls-remaining' };

export interface RewardGameDecisionContext {
  nowEpochMs: number;
}

const parseString = (
  value: unknown,
  error: RewardGameDecisionError
): Result<string, RewardGameDecisionError> => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error };
  }
  return { ok: true, value: value.trim() };
};

const parseNow = (value: unknown): Result<number, RewardGameDecisionError> => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: { kind: 'invalid-now' } };
  }
  return { ok: true, value };
};

const parseRandomDraws = (value: unknown): Result<readonly number[], RewardGameDecisionError> => {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: { kind: 'invalid-random-draws' } };
  }
  const draws: number[] = [];
  for (const entry of value) {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) {
      return { ok: false, error: { kind: 'invalid-random-draws' } };
    }
    draws.push(entry >>> 0);
  }
  return { ok: true, value: draws };
};

const parseDestinations = (value: unknown): Result<readonly string[], RewardGameDecisionError> => {
  if (!Array.isArray(value)) {
    return { ok: false, error: { kind: 'invalid-destinations' } };
  }
  const destinations: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      return { ok: false, error: { kind: 'invalid-destinations' } };
    }
    destinations.push(entry.trim());
  }
  return { ok: true, value: destinations };
};

const parseRandomValue = (value: unknown): Result<number, RewardGameDecisionError> => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: { kind: 'invalid-random-value' } };
  }
  return { ok: true, value: value >>> 0 };
};

const parseCandidateIndex = (value: unknown): Result<number, RewardGameDecisionError> => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return { ok: false, error: { kind: 'invalid-candidate-index' } };
  }
  return { ok: true, value };
};

const parseGameKind = (value: unknown): Result<RewardGameKind, RewardGameDecisionError> => {
  if (typeof value !== 'string' || !includes(REWARD_GAME_KINDS, value)) {
    return { ok: false, error: { kind: 'unsupported-game-command' } };
  }
  return { ok: true, value };
};

const toResolvedRound = (
  active: RewardGameActiveRound,
  selectedDestination: string,
  resolvedAtEpochMs: number,
  resolutionKind: RewardGameResolutionKind
): RewardGameValue => ({
  phase: 'resolved-round',
  nextGameIndex: active.nextGameIndex,
  roundId: active.roundId,
  sessionId: active.sessionId,
  kind: active.kind,
  candidates: [...active.candidates],
  selectedDestination,
  resolvedAtEpochMs,
  resolutionKind,
  freeRerollsRemaining: active.freeRerollsRemaining,
  candidateSnapshotRevision: active.candidateSnapshotRevision,
});

const worstCaseRerollBudgetSeconds = (kind: RewardGameKind): number => {
  const timing = GAME_BUDGET_SECONDS[kind];
  return timing.decision + timing.animation;
};

const canAffordReroll = (kind: RewardGameKind, remainingRecessBudgetSeconds: number): boolean => {
  const minRecessSeconds = 5 * 60;
  return remainingRecessBudgetSeconds >= worstCaseRerollBudgetSeconds(kind) + minRecessSeconds;
};

export const applyRewardGameCommand = (
  current: RewardGameValue,
  command: RewardGameCommand
): Result<RewardGameValue, RewardGameDecisionError> => {
  if (command.kind === 'start-round') {
    if (current.phase !== 'idle') {
      return { ok: false, error: { kind: 'round-already-active' } };
    }

    const sessionId = parseString(command.sessionId, { kind: 'invalid-session-id' });
    if (!sessionId.ok) {
      return sessionId;
    }
    const roundId = parseString(command.roundId, { kind: 'invalid-round-id' });
    if (!roundId.ok) {
      return roundId;
    }
    const destinations = parseDestinations(command.destinations);
    if (!destinations.ok) {
      return destinations;
    }
    const randomDraws = parseRandomDraws(command.randomDraws);
    if (!randomDraws.ok) {
      return randomDraws;
    }
    const now = parseNow(command.nowEpochMs);
    if (!now.ok) {
      return now;
    }

    const kindResult: Result<RewardGameKind, RewardGameDecisionError> =
      command.scheduledKind === undefined
        ? { ok: true, value: gameKindForIndex(current.nextGameIndex) }
        : parseGameKind(command.scheduledKind);
    if (!kindResult.ok) {
      return kindResult;
    }

    const candidates = selectCandidates(destinations.value, randomDraws.value);
    const active: RewardGameActiveRound = {
      phase: 'active-round',
      nextGameIndex: current.nextGameIndex,
      roundId: roundId.value,
      sessionId: sessionId.value,
      kind: kindResult.value,
      candidates,
      candidateSnapshotRevision: 1,
      decisionDeadlineEpochMs: decisionDeadlineEpochMs(kindResult.value, now.value),
      startedAtEpochMs: now.value,
      freeRerollsRemaining: FREE_REROLLS_PER_ROUND,
    };
    return { ok: true, value: active };
  }

  if (command.kind === 'choose-candidate') {
    if (current.phase !== 'active-round') {
      return { ok: false, error: { kind: 'no-active-round' } };
    }
    const roundId = parseString(command.roundId, { kind: 'invalid-round-id' });
    if (!roundId.ok) {
      return roundId;
    }
    if (roundId.value !== current.roundId) {
      return { ok: false, error: { kind: 'round-id-mismatch' } };
    }
    if (current.kind !== 'cards') {
      return { ok: false, error: { kind: 'unsupported-game-command' } };
    }
    const now = parseNow(command.nowEpochMs);
    if (!now.ok) {
      return now;
    }
    if (isDecisionDeadlineDue(current.decisionDeadlineEpochMs, now.value)) {
      return { ok: false, error: { kind: 'decision-deadline-expired' } };
    }
    const candidateIndex = parseCandidateIndex(command.candidateIndex);
    if (!candidateIndex.ok) {
      return candidateIndex;
    }
    const selected = resolveDestination(current.candidates, 'choice', {
      choiceIndex: candidateIndex.value,
      randomValue: 0,
    });
    if (!selected) {
      return { ok: false, error: { kind: 'invalid-candidate-index' } };
    }
    return {
      ok: true,
      value: toResolvedRound(current, selected, now.value, 'choice'),
    };
  }

  if (command.kind === 'trigger-resolution') {
    if (current.phase !== 'active-round') {
      return { ok: false, error: { kind: 'no-active-round' } };
    }
    const roundId = parseString(command.roundId, { kind: 'invalid-round-id' });
    if (!roundId.ok) {
      return roundId;
    }
    if (roundId.value !== current.roundId) {
      return { ok: false, error: { kind: 'round-id-mismatch' } };
    }
    if (current.kind === 'cards') {
      return { ok: false, error: { kind: 'unsupported-game-command' } };
    }
    const now = parseNow(command.nowEpochMs);
    if (!now.ok) {
      return now;
    }
    if (isDecisionDeadlineDue(current.decisionDeadlineEpochMs, now.value)) {
      return { ok: false, error: { kind: 'decision-deadline-expired' } };
    }
    const randomValue = parseRandomValue(command.randomValue);
    if (!randomValue.ok) {
      return randomValue;
    }
    const selected = resolveDestination(current.candidates, 'trigger', {
      randomValue: randomValue.value,
    });
    if (!selected) {
      return { ok: false, error: { kind: 'invalid-destinations' } };
    }
    return {
      ok: true,
      value: toResolvedRound(current, selected, now.value, 'trigger'),
    };
  }

  if (command.kind === 'resolve-deadline') {
    if (current.phase !== 'active-round') {
      return { ok: false, error: { kind: 'no-active-round' } };
    }
    const roundId = parseString(command.roundId, { kind: 'invalid-round-id' });
    if (!roundId.ok) {
      return roundId;
    }
    if (roundId.value !== current.roundId) {
      return { ok: false, error: { kind: 'round-id-mismatch' } };
    }
    const now = parseNow(command.nowEpochMs);
    if (!now.ok) {
      return now;
    }
    if (!isDecisionDeadlineDue(current.decisionDeadlineEpochMs, now.value)) {
      return { ok: false, error: { kind: 'decision-deadline-not-due' } };
    }
    const randomValue = parseRandomValue(command.randomValue);
    if (!randomValue.ok) {
      return randomValue;
    }
    const selected = resolveDestination(current.candidates, 'timeout', {
      randomValue: randomValue.value,
    });
    if (!selected) {
      return { ok: false, error: { kind: 'invalid-destinations' } };
    }
    return {
      ok: true,
      value: toResolvedRound(current, selected, now.value, 'timeout'),
    };
  }

  if (command.kind === 'complete-round') {
    if (current.phase !== 'resolved-round') {
      return { ok: false, error: { kind: 'no-active-round' } };
    }
    const roundId = parseString(command.roundId, { kind: 'invalid-round-id' });
    if (!roundId.ok) {
      return roundId;
    }
    if (roundId.value !== current.roundId) {
      return { ok: false, error: { kind: 'round-id-mismatch' } };
    }
    return {
      ok: true,
      value: {
        phase: 'idle',
        nextGameIndex: (current.nextGameIndex + 1) % 3,
      },
    };
  }

  if (command.kind === 'reroll') {
    if (current.phase !== 'resolved-round') {
      return { ok: false, error: { kind: 'round-already-resolved' } };
    }
    const roundId = parseString(command.roundId, { kind: 'invalid-round-id' });
    if (!roundId.ok) {
      return roundId;
    }
    if (roundId.value !== current.roundId) {
      return { ok: false, error: { kind: 'round-id-mismatch' } };
    }
    const destinations = parseDestinations(command.destinations);
    if (!destinations.ok) {
      return destinations;
    }
    const randomDraws = parseRandomDraws(command.randomDraws);
    if (!randomDraws.ok) {
      return randomDraws;
    }
    const now = parseNow(command.nowEpochMs);
    if (!now.ok) {
      return now;
    }
    if (typeof command.coinBalance !== 'number' || !Number.isInteger(command.coinBalance)) {
      return { ok: false, error: { kind: 'invalid-coin-balance' } };
    }
    if (
      typeof command.remainingRecessBudgetSeconds !== 'number' ||
      !Number.isInteger(command.remainingRecessBudgetSeconds)
    ) {
      return { ok: false, error: { kind: 'invalid-recess-budget' } };
    }
    if (!canAffordReroll(current.kind, command.remainingRecessBudgetSeconds)) {
      return { ok: false, error: { kind: 'reroll-budget-exceeded' } };
    }

    const paid = command.paid === true;
    if (!paid) {
      if (current.freeRerollsRemaining <= 0) {
        return { ok: false, error: { kind: 'no-free-rerolls-remaining' } };
      }
    } else if (command.coinBalance < PAID_REROLL_COST) {
      return {
        ok: false,
        error: {
          kind: 'insufficient-coins',
          balance: command.coinBalance,
          required: PAID_REROLL_COST,
        },
      };
    }

    const nextFreeRerolls = paid ? current.freeRerollsRemaining : current.freeRerollsRemaining - 1;

    let candidates: string[];
    if (current.kind === 'cards') {
      const selectedIndex = current.candidates.indexOf(current.selectedDestination);
      const pool = destinations.value.filter(
        (entry) => !current.candidates.includes(entry.trim().toLowerCase())
      );
      const replacementDraw = randomDraws.value[0] ?? 0;
      const replacementPool =
        pool.length > 0 ? pool : destinations.value.filter((entry) => entry.trim().length > 0);
      const replacement =
        replacementPool[replacementDraw % replacementPool.length]?.trim().toLowerCase() ??
        current.selectedDestination;
      candidates = [...current.candidates];
      if (selectedIndex >= 0) {
        candidates[selectedIndex] = replacement;
      } else {
        candidates = selectCandidates(destinations.value, randomDraws.value);
      }
    } else {
      candidates = selectCandidates(destinations.value, randomDraws.value);
    }

    const active: RewardGameActiveRound = {
      phase: 'active-round',
      nextGameIndex: current.nextGameIndex,
      roundId: current.roundId,
      sessionId: current.sessionId,
      kind: current.kind,
      candidates,
      candidateSnapshotRevision: current.candidateSnapshotRevision + 1,
      decisionDeadlineEpochMs: decisionDeadlineEpochMs(current.kind, now.value),
      startedAtEpochMs: now.value,
      freeRerollsRemaining: nextFreeRerolls,
    };
    return { ok: true, value: active };
  }

  return { ok: false, error: { kind: 'unsupported-game-command' } };
};

export const reconstructRewardGameValue = (value: RewardGameValue): RewardGameValue =>
  cloneRewardGameValue(value);

export const rewardGameRoundCommandId = (roundId: string, action: string): string =>
  `reward-game-${roundId}-${action}`;

export const outcomeCommittedBeforePresentation = (value: RewardGameValue): boolean =>
  value.phase === 'resolved-round' && value.selectedDestination.length > 0;

export const presentationAnimationCapSeconds = (kind: RewardGameKind): number =>
  maxAnimationSeconds(kind);
