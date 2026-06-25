import type { Result } from '@/modules/persisted-application-state/types';
import { gameKindForIndex } from '@/modules/reward-game';
import type { WorkRhythmRecess, WorkRhythmRewardGame, WorkRhythmValue } from './workRhythmDocument';
import { decidePostGameRecess } from '@/modules/scheduler';
import type { PreferredCadence } from '@/modules/workstyle-profile';
import { BACK_TO_WORK_COUNTDOWN_SECONDS } from './workRhythmDocument';
import { createRecessStartedFact, recessStartedFactId } from './recessStarted';
import type { WorkHistoryFact } from '@/modules/work-history';

export type AcceptRecessError = { kind: 'invalid-phase-for-accept-recess' };

export interface AcceptRecessContext {
  nowEpochMs: number;
  preferredCadence: PreferredCadence;
  blockListEntries: readonly string[];
  nextGameIndex: number;
  roundId: string;
  selectedTaskRemainingSeconds: number | null;
}

export interface AcceptRecessOutcome {
  nextValue: WorkRhythmValue;
  commandId: string;
  skipRewardGame: boolean;
  recessStartedFact?: WorkHistoryFact;
}

export const acceptRecessCommandId = (sessionId: string, focusBlockIndex: number): string =>
  `accept-recess-${sessionId}-block-${focusBlockIndex}`;

export const remainingWorkSessionSecondsAt = (
  value: {
    sessionStartedAtEpochMs: number;
    settledRemainingWorkSessionSeconds: number;
  },
  nowEpochMs: number
): number => {
  const elapsedWorkSeconds = Math.max(
    0,
    Math.floor((nowEpochMs - value.sessionStartedAtEpochMs) / 1000)
  );
  return Math.max(0, value.settledRemainingWorkSessionSeconds - elapsedWorkSeconds);
};

export const decideAcceptRecess = (
  current: WorkRhythmValue,
  context: AcceptRecessContext
): Result<AcceptRecessOutcome, AcceptRecessError> => {
  if (current.phase !== 'recess-prompt') {
    return { ok: false, error: { kind: 'invalid-phase-for-accept-recess' } };
  }

  const prompt = current;
  const commandId = acceptRecessCommandId(prompt.sessionId, prompt.completedFocusBlockIndex);
  const remainingWorkSessionSeconds = remainingWorkSessionSecondsAt(prompt, context.nowEpochMs);

  if (context.blockListEntries.length === 0) {
    const postGame = decidePostGameRecess({
      preferredCadence: context.preferredCadence,
      energy: prompt.energy,
      momentum: prompt.momentum,
      workSessionProgressRatio:
        prompt.originalGoalSeconds === 0
          ? 0
          : (prompt.originalGoalSeconds - remainingWorkSessionSeconds) / prompt.originalGoalSeconds,
      selectedTaskRemainingSeconds: context.selectedTaskRemainingSeconds,
      remainingWorkSessionSeconds,
    });
    const recess: WorkRhythmRecess = {
      phase: 'recess',
      sessionId: prompt.sessionId,
      originalGoalSeconds: prompt.originalGoalSeconds,
      sessionStartedAtEpochMs: prompt.sessionStartedAtEpochMs,
      settledRemainingWorkSessionSeconds: remainingWorkSessionSeconds,
      energy: prompt.energy,
      momentum: prompt.momentum,
      focusBlockStreak: prompt.focusBlockStreak,
      nextFocusBlockIndex: prompt.completedFocusBlockIndex + 1,
      recessPassDestination: null,
      recessStartedAtEpochMs: context.nowEpochMs,
      recessDeadlineAtEpochMs: context.nowEpochMs + postGame.recessSeconds * 1000,
      recessDurationSeconds: postGame.recessSeconds,
      schedulerReasons: postGame.reasons.map((reason) => ({ ...reason })),
    };
    return {
      ok: true,
      value: {
        nextValue: recess,
        commandId,
        skipRewardGame: true,
        recessStartedFact: createRecessStartedFact({
          factId: recessStartedFactId(prompt.sessionId, prompt.completedFocusBlockIndex),
          recordedAt: context.nowEpochMs,
          workSessionId: prompt.sessionId,
          focusBlockIndex: prompt.completedFocusBlockIndex,
          startedAtEpochMs: context.nowEpochMs,
          plannedRecessSeconds: postGame.recessSeconds,
        }),
      },
    };
  }

  const rewardGame: WorkRhythmRewardGame = {
    phase: 'reward-game',
    sessionId: prompt.sessionId,
    originalGoalSeconds: prompt.originalGoalSeconds,
    sessionStartedAtEpochMs: prompt.sessionStartedAtEpochMs,
    settledRemainingWorkSessionSeconds: remainingWorkSessionSeconds,
    energy: prompt.energy,
    momentum: prompt.momentum,
    focusBlockStreak: prompt.focusBlockStreak,
    completedFocusBlockIndex: prompt.completedFocusBlockIndex,
    roundId: context.roundId,
  };

  void gameKindForIndex(context.nextGameIndex);
  return { ok: true, value: { nextValue: rewardGame, commandId, skipRewardGame: false } };
};

export const workRhythmCountdownDeadlineEpochMs = (startedAtEpochMs: number): number =>
  startedAtEpochMs + BACK_TO_WORK_COUNTDOWN_SECONDS * 1000;
