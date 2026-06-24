import type { Result } from '@/modules/persisted-application-state/types';
import { decideFocusRecessCycle } from '@/modules/scheduler';
import type { RewardGameBudget } from '@/modules/scheduler';
import type { PreferredCadence } from '@/modules/workstyle-profile';
import type {
  WorkRhythmFocusBlock,
  WorkRhythmRecessPrompt,
  WorkRhythmValue,
} from './workRhythmDocument';

export type DeclineRecessError =
  | { kind: 'invalid-phase-for-decline-recess' }
  | { kind: 'cannot-decline-without-deferred-recess' };

export interface DeclineRecessContext {
  nowEpochMs: number;
  preferredCadence: PreferredCadence;
  selectedTaskRemainingMinutes: number | null;
  gameBudget: RewardGameBudget;
}

export interface DeclineRecessOutcome {
  nextValue: WorkRhythmFocusBlock;
  commandId: string;
}

export const declineRecessCommandId = (
  sessionId: string,
  focusBlockIndex: number,
  settlementSegment: number
): string => `decline-recess-${sessionId}-block-${focusBlockIndex}-seg-${settlementSegment}`;

export const remainingWorkSessionSecondsAt = (
  recess: WorkRhythmRecessPrompt,
  nowEpochMs: number
): number => {
  const elapsedWorkSeconds = Math.max(
    0,
    Math.floor((nowEpochMs - recess.sessionStartedAtEpochMs) / 1000)
  );
  return Math.max(0, recess.settledRemainingWorkSessionSeconds - elapsedWorkSeconds);
};

export const decideDeclineRecess = (
  current: WorkRhythmValue,
  context: DeclineRecessContext
): Result<DeclineRecessOutcome, DeclineRecessError> => {
  if (current.phase !== 'recess-prompt') {
    return { ok: false, error: { kind: 'invalid-phase-for-decline-recess' } };
  }

  const recess = current as WorkRhythmRecessPrompt;
  if (recess.deferredRecessCount !== 1) {
    return { ok: false, error: { kind: 'cannot-decline-without-deferred-recess' } };
  }

  const remainingWorkSessionSeconds = remainingWorkSessionSecondsAt(recess, context.nowEpochMs);
  const workSessionProgressRatio =
    recess.originalGoalSeconds === 0
      ? 0
      : (recess.originalGoalSeconds - remainingWorkSessionSeconds) / recess.originalGoalSeconds;

  const schedulerDecision = decideFocusRecessCycle({
    preferredCadence: context.preferredCadence,
    energy: recess.energy,
    momentum: recess.momentum,
    workSessionProgressRatio,
    selectedTaskRemainingMinutes: context.selectedTaskRemainingMinutes,
    remainingWorkSessionSeconds,
    gameBudget: context.gameBudget,
  });

  const focusDurationSeconds = schedulerDecision.focusMinutes * 60;
  const settlementSegment = recess.lastSettledSegment + 1;

  return {
    ok: true,
    value: {
      commandId: declineRecessCommandId(
        recess.sessionId,
        recess.completedFocusBlockIndex,
        settlementSegment
      ),
      nextValue: {
        phase: 'focus-block',
        sessionId: recess.sessionId,
        originalGoalSeconds: recess.originalGoalSeconds,
        sessionStartedAtEpochMs: context.nowEpochMs,
        remainingWorkSessionSeconds,
        settledRemainingWorkSessionSeconds: remainingWorkSessionSeconds,
        energy: recess.energy,
        momentum: recess.momentum,
        focusBlockIndex: recess.completedFocusBlockIndex,
        focusBlockStartedAtEpochMs: context.nowEpochMs,
        focusDeadlineAtEpochMs: context.nowEpochMs + focusDurationSeconds * 1000,
        focusDurationSeconds,
        isFinalFocus: schedulerDecision.isFinalFocus,
        wasExtension: true,
        schedulerReasons: schedulerDecision.reasons.map((reason) => ({ ...reason })),
        focusBlockStreak: recess.focusBlockStreak,
        settlementSegment,
        originalGoalPermanentlyComplete: recess.originalGoalPermanentlyComplete,
        isWorkSessionExtension: recess.isWorkSessionExtension,
        extensionTrancheSeconds: recess.extensionTrancheSeconds,
        extensionBaselineCumulativeSeconds: recess.extensionBaselineCumulativeSeconds,
        extensionBaselineCount: recess.extensionBaselineCount,
      },
    },
  };
};
