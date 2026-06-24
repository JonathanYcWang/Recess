import type { Result } from '@/modules/persisted-application-state/types';
import type {
  WorkRhythmBackToWorkCountdown,
  WorkRhythmRecess,
  WorkRhythmValue,
} from './workRhythmDocument';
import type { WorkRhythmFocusBlock } from './workRhythmDocument';
import { decideFocusRecessCycle } from '@/modules/scheduler';
import { gameKindForIndex } from '@/modules/reward-game';
import type { PreferredCadence } from '@/modules/workstyle-profile';
import { remainingWorkSessionSecondsAt } from './acceptRecess';
import { workRhythmCountdownDeadlineEpochMs } from './acceptRecess';

export type EndRecessError = { kind: 'invalid-phase-for-end-recess' } | { kind: 'recess-not-due' };

export interface EndRecessContext {
  nowEpochMs: number;
  preferredCadence: PreferredCadence;
  selectedTaskRemainingMinutes: number | null;
  nextGameIndex: number;
  early: boolean;
}

export interface EndRecessOutcome {
  nextValue: WorkRhythmBackToWorkCountdown;
  commandId: string;
}

export const endRecessCommandId = (sessionId: string, early: boolean): string =>
  `end-recess-${sessionId}-${early ? 'early' : 'natural'}`;

export const isRecessDeadlineDue = (recess: WorkRhythmRecess, nowEpochMs: number): boolean =>
  nowEpochMs >= recess.recessDeadlineAtEpochMs;

export const decideEndRecess = (
  current: WorkRhythmValue,
  context: EndRecessContext
): Result<EndRecessOutcome, EndRecessError> => {
  if (current.phase !== 'recess') {
    return { ok: false, error: { kind: 'invalid-phase-for-end-recess' } };
  }
  if (!context.early && !isRecessDeadlineDue(current, context.nowEpochMs)) {
    return { ok: false, error: { kind: 'recess-not-due' } };
  }

  const remainingWorkSessionSeconds = remainingWorkSessionSecondsAt(current, context.nowEpochMs);
  return {
    ok: true,
    value: {
      commandId: endRecessCommandId(current.sessionId, context.early),
      nextValue: {
        phase: 'back-to-work-countdown',
        sessionId: current.sessionId,
        originalGoalSeconds: current.originalGoalSeconds,
        sessionStartedAtEpochMs: current.sessionStartedAtEpochMs,
        settledRemainingWorkSessionSeconds: remainingWorkSessionSeconds,
        energy: current.energy,
        momentum: current.momentum,
        focusBlockStreak: current.focusBlockStreak,
        nextFocusBlockIndex: current.nextFocusBlockIndex,
        countdownStartedAtEpochMs: context.nowEpochMs,
        countdownDeadlineAtEpochMs: workRhythmCountdownDeadlineEpochMs(context.nowEpochMs),
      },
    },
  };
};

export type CompleteCountdownError =
  | { kind: 'invalid-phase-for-countdown' }
  | { kind: 'countdown-not-due' };

export interface CompleteCountdownContext {
  nowEpochMs: number;
  preferredCadence: PreferredCadence;
  selectedTaskRemainingMinutes: number | null;
  nextGameIndex: number;
}

export interface CompleteCountdownOutcome {
  nextValue: WorkRhythmFocusBlock;
  commandId: string;
}

export const completeCountdownCommandId = (sessionId: string): string =>
  `complete-countdown-${sessionId}`;

export const isCountdownDue = (
  countdown: WorkRhythmBackToWorkCountdown,
  nowEpochMs: number
): boolean => nowEpochMs >= countdown.countdownDeadlineAtEpochMs;

export const decideCompleteCountdown = (
  current: WorkRhythmValue,
  context: CompleteCountdownContext
): Result<CompleteCountdownOutcome, CompleteCountdownError> => {
  if (current.phase !== 'back-to-work-countdown') {
    return { ok: false, error: { kind: 'invalid-phase-for-countdown' } };
  }
  if (!isCountdownDue(current, context.nowEpochMs)) {
    return { ok: false, error: { kind: 'countdown-not-due' } };
  }

  const remainingWorkSessionSeconds = remainingWorkSessionSecondsAt(current, context.nowEpochMs);
  const schedulerDecision = decideFocusRecessCycle({
    preferredCadence: context.preferredCadence,
    energy: current.energy,
    momentum: current.momentum,
    workSessionProgressRatio:
      current.originalGoalSeconds === 0
        ? 0
        : (current.originalGoalSeconds - remainingWorkSessionSeconds) / current.originalGoalSeconds,
    selectedTaskRemainingMinutes: context.selectedTaskRemainingMinutes,
    remainingWorkSessionSeconds,
    gameBudget: { kind: gameKindForIndex(context.nextGameIndex) },
  });

  const focusDurationSeconds = schedulerDecision.focusMinutes * 60;
  return {
    ok: true,
    value: {
      commandId: completeCountdownCommandId(current.sessionId),
      nextValue: {
        phase: 'focus-block',
        sessionId: current.sessionId,
        originalGoalSeconds: current.originalGoalSeconds,
        sessionStartedAtEpochMs: current.sessionStartedAtEpochMs,
        remainingWorkSessionSeconds,
        settledRemainingWorkSessionSeconds: remainingWorkSessionSeconds,
        energy: current.energy,
        momentum: current.momentum,
        focusBlockIndex: current.nextFocusBlockIndex,
        focusBlockStartedAtEpochMs: context.nowEpochMs,
        focusDeadlineAtEpochMs: context.nowEpochMs + focusDurationSeconds * 1000,
        focusDurationSeconds,
        isFinalFocus: schedulerDecision.isFinalFocus,
        wasExtension: false,
        schedulerReasons: schedulerDecision.reasons.map((reason) => ({ ...reason })),
        focusBlockStreak: current.focusBlockStreak,
        settlementSegment: 0,
        originalGoalPermanentlyComplete: false,
        isWorkSessionExtension: false,
        extensionTrancheSeconds: 0,
        extensionBaselineCumulativeSeconds: 0,
        extensionBaselineCount: 0,
      },
    },
  };
};
