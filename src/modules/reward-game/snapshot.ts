import type { RewardGameKind } from '@/modules/scheduler';
import { gameKindForIndex } from './rewardGameDocument';
import { remainingDecisionSeconds, maxAnimationSeconds } from './roundTiming';
import type { RewardGameValue } from './rewardGameDocument';

export type RewardGameIdleSnapshot = {
  phase: 'idle';
  nextGameKind: RewardGameKind;
};

export type RewardGameActiveRoundSnapshot = {
  phase: 'active-round';
  roundId: string;
  sessionId: string;
  kind: RewardGameKind;
  candidates: readonly string[];
  remainingDecisionSeconds: number;
  freeRerollsRemaining: number;
  maxAnimationSeconds: number;
};

export type RewardGameResolvedRoundSnapshot = {
  phase: 'resolved-round';
  roundId: string;
  sessionId: string;
  kind: RewardGameKind;
  candidates: readonly string[];
  selectedDestination: string;
  resolutionKind: 'choice' | 'timeout' | 'trigger';
  freeRerollsRemaining: number;
  maxAnimationSeconds: number;
};

export type RewardGameSnapshot =
  | RewardGameIdleSnapshot
  | RewardGameActiveRoundSnapshot
  | RewardGameResolvedRoundSnapshot;

export const projectRewardGameSnapshot = (
  value: RewardGameValue,
  nowEpochMs: number
): RewardGameSnapshot => {
  if (value.phase === 'idle') {
    return {
      phase: 'idle',
      nextGameKind: gameKindForIndex(value.nextGameIndex),
    };
  }

  if (value.phase === 'active-round') {
    return {
      phase: 'active-round',
      roundId: value.roundId,
      sessionId: value.sessionId,
      kind: value.kind,
      candidates: [...value.candidates],
      remainingDecisionSeconds: remainingDecisionSeconds(value.decisionDeadlineEpochMs, nowEpochMs),
      freeRerollsRemaining: value.freeRerollsRemaining,
      maxAnimationSeconds: maxAnimationSeconds(value.kind),
    };
  }

  return {
    phase: 'resolved-round',
    roundId: value.roundId,
    sessionId: value.sessionId,
    kind: value.kind,
    candidates: [...value.candidates],
    selectedDestination: value.selectedDestination,
    resolutionKind: value.resolutionKind,
    freeRerollsRemaining: value.freeRerollsRemaining,
    maxAnimationSeconds: maxAnimationSeconds(value.kind),
  };
};
