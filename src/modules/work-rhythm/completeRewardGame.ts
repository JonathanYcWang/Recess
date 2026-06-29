import type { Result } from '@/runtime/persistence/types';
import { decidePostGameRecess } from '@/modules/scheduler';
import type { PreferredCadence } from '@/modules/workstyle-profile';
import type { WorkRhythmRecess, WorkRhythmValue } from './workRhythmDocument';
import { remainingWorkSessionSecondsAt } from './acceptRecess';
import { createRecessStartedFact, recessStartedFactId } from './recessStarted';
import type { WorkHistoryFact } from '@/modules/work-history';

export type CompleteRewardGameError =
  | { kind: 'invalid-phase-for-complete-reward-game' }
  | { kind: 'round-id-mismatch' };

export interface CompleteRewardGameContext {
  nowEpochMs: number;
  preferredCadence: PreferredCadence;
  selectedTaskRemainingSeconds: number | null;
  roundId: string;
  selectedDestination: string;
}

export interface CompleteRewardGameOutcome {
  nextValue: WorkRhythmRecess;
  commandId: string;
  recessStartedFact: WorkHistoryFact;
}

export const completeRewardGameCommandId = (sessionId: string, roundId: string): string =>
  `complete-reward-game-${sessionId}-${roundId}`;

export const decideCompleteRewardGame = (
  current: WorkRhythmValue,
  context: CompleteRewardGameContext
): Result<CompleteRewardGameOutcome, CompleteRewardGameError> => {
  if (current.phase !== 'reward-game') {
    return { ok: false, error: { kind: 'invalid-phase-for-complete-reward-game' } };
  }
  if (current.roundId !== context.roundId) {
    return { ok: false, error: { kind: 'round-id-mismatch' } };
  }

  const remainingWorkSessionSeconds = remainingWorkSessionSecondsAt(current, context.nowEpochMs);
  const postGame = decidePostGameRecess({
    preferredCadence: context.preferredCadence,
    energy: current.energy,
    momentum: current.momentum,
    workSessionProgressRatio:
      current.originalGoalSeconds === 0
        ? 0
        : (current.originalGoalSeconds - remainingWorkSessionSeconds) / current.originalGoalSeconds,
    selectedTaskRemainingSeconds: context.selectedTaskRemainingSeconds,
    remainingWorkSessionSeconds,
  });

  return {
    ok: true,
    value: {
      commandId: completeRewardGameCommandId(current.sessionId, context.roundId),
      nextValue: {
        phase: 'recess',
        sessionId: current.sessionId,
        originalGoalSeconds: current.originalGoalSeconds,
        sessionStartedAtEpochMs: current.sessionStartedAtEpochMs,
        settledRemainingWorkSessionSeconds: remainingWorkSessionSeconds,
        energy: current.energy,
        momentum: current.momentum,
        focusBlockStreak: current.focusBlockStreak,
        nextFocusBlockIndex: current.completedFocusBlockIndex + 1,
        recessPassDestination: context.selectedDestination.trim().toLowerCase(),
        recessStartedAtEpochMs: context.nowEpochMs,
        recessDeadlineAtEpochMs: context.nowEpochMs + postGame.recessSeconds * 1000,
        recessDurationSeconds: postGame.recessSeconds,
        schedulerReasons: postGame.reasons.map((reason) => ({ ...reason })),
      },
      recessStartedFact: createRecessStartedFact({
        factId: recessStartedFactId(current.sessionId, current.completedFocusBlockIndex),
        recordedAt: context.nowEpochMs,
        workSessionId: current.sessionId,
        focusBlockIndex: current.completedFocusBlockIndex,
        startedAtEpochMs: context.nowEpochMs,
        plannedRecessSeconds: postGame.recessSeconds,
      }),
    },
  };
};
