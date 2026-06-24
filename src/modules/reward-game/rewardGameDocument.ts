import type { RewardGameKind } from '@/modules/scheduler';

export const FREE_REROLLS_PER_ROUND = 3;
export const PAID_REROLL_COST = 5;
export const MAX_CANDIDATES = 3;

export type RewardGameResolutionKind = 'choice' | 'timeout' | 'trigger';

export interface RewardGameIdle {
  phase: 'idle';
  nextGameIndex: number;
}

export interface RewardGameActiveRound {
  phase: 'active-round';
  nextGameIndex: number;
  roundId: string;
  sessionId: string;
  kind: RewardGameKind;
  candidates: readonly string[];
  candidateSnapshotRevision: number;
  decisionDeadlineEpochMs: number;
  startedAtEpochMs: number;
  freeRerollsRemaining: number;
}

export interface RewardGameResolvedRound {
  phase: 'resolved-round';
  nextGameIndex: number;
  roundId: string;
  sessionId: string;
  kind: RewardGameKind;
  candidates: readonly string[];
  selectedDestination: string;
  resolvedAtEpochMs: number;
  resolutionKind: RewardGameResolutionKind;
  freeRerollsRemaining: number;
  candidateSnapshotRevision: number;
}

export type RewardGameValue = RewardGameIdle | RewardGameActiveRound | RewardGameResolvedRound;

export const createDefaultRewardGameValue = (): RewardGameIdle => ({
  phase: 'idle',
  nextGameIndex: 0,
});

export const gameKindForIndex = (index: number): RewardGameKind => {
  const normalized = ((index % 3) + 3) % 3;
  if (normalized === 1) {
    return 'wheel';
  }
  if (normalized === 2) {
    return 'slots';
  }
  return 'cards';
};

export const cloneRewardGameValue = (value: RewardGameValue): RewardGameValue => {
  if (value.phase === 'idle') {
    return { phase: 'idle', nextGameIndex: value.nextGameIndex };
  }
  if (value.phase === 'active-round') {
    return {
      ...value,
      candidates: [...value.candidates],
    };
  }
  return {
    ...value,
    candidates: [...value.candidates],
  };
};
