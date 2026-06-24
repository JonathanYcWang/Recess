import { GAME_BUDGET_SECONDS, type RewardGameKind } from '@/modules/scheduler';

export const decisionWindowSeconds = (kind: RewardGameKind): number =>
  GAME_BUDGET_SECONDS[kind].decision;

export const maxAnimationSeconds = (kind: RewardGameKind): number =>
  GAME_BUDGET_SECONDS[kind].animation;

export const decisionDeadlineEpochMs = (kind: RewardGameKind, startedAtEpochMs: number): number =>
  startedAtEpochMs + decisionWindowSeconds(kind) * 1000;

export const isDecisionDeadlineDue = (deadlineEpochMs: number, nowEpochMs: number): boolean =>
  nowEpochMs >= deadlineEpochMs;

export const remainingDecisionSeconds = (deadlineEpochMs: number, nowEpochMs: number): number =>
  Math.max(0, Math.ceil((deadlineEpochMs - nowEpochMs) / 1000));
