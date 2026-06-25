import type { Result } from '@/modules/persisted-application-state/types';
import { decideFocusRecessCycle } from '@/modules/scheduler';
import type { RewardGameBudget } from '@/modules/scheduler';
import type { PreferredCadence } from '@/modules/workstyle-profile';
import { createWorkSessionExtendedFact, workSessionExtendedFactId } from './workSessionExtended';
import {
  isValidWorkSessionExtensionSeconds,
  remainingWorkSessionExtensionSeconds,
} from './workSessionExtension';
import type { WorkRhythmValue, WorkRhythmWorkSessionCompleted } from './workRhythmDocument';
import { emptyTaskSelectionState } from './workRhythmDocument';
import type { WorkHistoryFact } from '@/modules/work-history';

export type StartWorkSessionExtensionError =
  | { kind: 'invalid-phase-for-extension' }
  | { kind: 'invalid-extension-goal' }
  | { kind: 'extension-limit-exceeded' };

export interface StartWorkSessionExtensionContext {
  nowEpochMs: number;
  preferredCadence: PreferredCadence;
  selectedTaskRemainingSeconds: number | null;
  gameBudget: RewardGameBudget;
}

export interface StartWorkSessionExtensionOutcome {
  nextValue: import('./workRhythmDocument').WorkRhythmFocusBlock;
  commandId: string;
  workSessionExtendedFact: WorkHistoryFact;
}

export const startWorkSessionExtensionCommandId = (
  sessionId: string,
  extensionOrdinal: number
): string => `start-work-session-extension-${sessionId}-${extensionOrdinal}`;

export const decideStartWorkSessionExtension = (
  current: WorkRhythmValue,
  extensionSeconds: unknown,
  context: StartWorkSessionExtensionContext
): Result<StartWorkSessionExtensionOutcome, StartWorkSessionExtensionError> => {
  if (current.phase !== 'work-session-completed') {
    return { ok: false, error: { kind: 'invalid-phase-for-extension' } };
  }

  const completed = current as WorkRhythmWorkSessionCompleted;
  if (
    typeof extensionSeconds !== 'number' ||
    !isValidWorkSessionExtensionSeconds(extensionSeconds)
  ) {
    return { ok: false, error: { kind: 'invalid-extension-goal' } };
  }

  const remainingAllowance = remainingWorkSessionExtensionSeconds(
    completed.cumulativeExtensionSeconds
  );
  if (extensionSeconds > remainingAllowance) {
    return { ok: false, error: { kind: 'extension-limit-exceeded' } };
  }

  const schedulerDecision = decideFocusRecessCycle({
    preferredCadence: context.preferredCadence,
    energy: completed.energy,
    momentum: completed.momentum,
    workSessionProgressRatio: 1,
    selectedTaskRemainingSeconds: context.selectedTaskRemainingSeconds,
    remainingWorkSessionSeconds: extensionSeconds,
    gameBudget: context.gameBudget,
  });

  const focusDurationSeconds = schedulerDecision.focusDurationSeconds;
  const extensionOrdinal = completed.extensionCount;

  return {
    ok: true,
    value: {
      commandId: startWorkSessionExtensionCommandId(completed.sessionId, extensionOrdinal),
      nextValue: {
        phase: 'focus-block',
        sessionId: completed.sessionId,
        originalGoalSeconds: completed.originalGoalSeconds,
        sessionStartedAtEpochMs: context.nowEpochMs,
        remainingWorkSessionSeconds: extensionSeconds,
        settledRemainingWorkSessionSeconds: extensionSeconds,
        energy: completed.energy,
        momentum: completed.momentum,
        focusBlockIndex: completed.lastCompletedFocusBlockIndex + 1,
        focusBlockStartedAtEpochMs: context.nowEpochMs,
        focusDeadlineAtEpochMs: context.nowEpochMs + focusDurationSeconds * 1000,
        focusDurationSeconds,
        isFinalFocus: schedulerDecision.isFinalFocus,
        wasExtension: false,
        schedulerReasons: schedulerDecision.reasons.map((reason) => ({ ...reason })),
        focusBlockStreak: completed.focusBlockStreak,
        settlementSegment: 0,
        originalGoalPermanentlyComplete: true,
        isWorkSessionExtension: true,
        extensionTrancheSeconds: extensionSeconds,
        extensionBaselineCumulativeSeconds: completed.cumulativeExtensionSeconds,
        extensionBaselineCount: completed.extensionCount,
        ...emptyTaskSelectionState(),
      },
      workSessionExtendedFact: createWorkSessionExtendedFact({
        factId: workSessionExtendedFactId(completed.sessionId, extensionOrdinal),
        recordedAt: context.nowEpochMs,
        workSessionId: completed.sessionId,
        extensionOrdinal,
        extensionSeconds,
        extendedAtEpochMs: context.nowEpochMs,
      }),
    },
  };
};

export const toWorkSessionCompletedPhase = (
  focus: import('./workRhythmDocument').WorkRhythmFocusBlock,
  nowEpochMs: number
): WorkRhythmWorkSessionCompleted => ({
  phase: 'work-session-completed',
  sessionId: focus.sessionId,
  originalGoalSeconds: focus.originalGoalSeconds,
  cumulativeExtensionSeconds: focus.isWorkSessionExtension
    ? focus.extensionBaselineCumulativeSeconds + focus.extensionTrancheSeconds
    : 0,
  extensionCount: focus.isWorkSessionExtension ? focus.extensionBaselineCount + 1 : 0,
  energy: focus.energy,
  momentum: focus.momentum,
  focusBlockStreak: focus.focusBlockStreak,
  lastCompletedFocusBlockIndex: focus.focusBlockIndex,
  originalGoalPermanentlyComplete: true,
  sessionCompletedAtEpochMs: nowEpochMs,
});
