import type { Result } from '@/runtime/persistence/types';
import { computeActualFocusSeconds } from './settleFocusBoundary';
import { createTimeOutStartedFact, timeOutStartedFactId } from './timeOutStarted';
import type {
  WorkRhythmFocusBlock,
  WorkRhythmTimeOut,
  WorkRhythmValue,
} from './workRhythmDocument';
import type { WorkHistoryFact } from '@/modules/work-history';

export type StartTimeOutError =
  | { kind: 'invalid-phase-for-time-out' }
  | { kind: 'already-in-time-out' };

export interface StartTimeOutOutcome {
  nextValue: WorkRhythmTimeOut;
  commandId: string;
  timeOutStartedFact: WorkHistoryFact;
}

export const startTimeOutCommandId = (sessionId: string): string => `start-time-out-${sessionId}`;

export const decideStartTimeOut = (
  current: WorkRhythmValue,
  nowEpochMs: number
): Result<StartTimeOutOutcome, StartTimeOutError> => {
  if (current.phase === 'time-out') {
    return { ok: false, error: { kind: 'already-in-time-out' } };
  }
  if (current.phase !== 'focus-block') {
    return { ok: false, error: { kind: 'invalid-phase-for-time-out' } };
  }

  const focus = current as WorkRhythmFocusBlock;
  const actualFocusSeconds = computeActualFocusSeconds(focus, nowEpochMs);
  const settledRemainingWorkSessionSeconds = Math.max(
    0,
    focus.settledRemainingWorkSessionSeconds - actualFocusSeconds
  );
  const settledRemainingFocusSeconds = Math.max(0, focus.focusDurationSeconds - actualFocusSeconds);

  return {
    ok: true,
    value: {
      commandId: startTimeOutCommandId(focus.sessionId),
      nextValue: {
        phase: 'time-out',
        sessionId: focus.sessionId,
        originalGoalSeconds: focus.originalGoalSeconds,
        settledRemainingWorkSessionSeconds,
        settledRemainingFocusSeconds,
        energy: focus.energy,
        momentum: focus.momentum,
        focusBlockIndex: focus.focusBlockIndex,
        focusDurationSeconds: focus.focusDurationSeconds,
        isFinalFocus: focus.isFinalFocus,
        wasExtension: focus.wasExtension,
        schedulerReasons: focus.schedulerReasons.map((reason) => ({ ...reason })),
        focusBlockStreak: focus.focusBlockStreak,
        settlementSegment: focus.settlementSegment,
        timeOutStartedAtEpochMs: nowEpochMs,
        lastReportedFiveMinuteBoundary: 0,
        momentumLoweredDuringTimeOut: false,
        originalGoalPermanentlyComplete: focus.originalGoalPermanentlyComplete,
        isWorkSessionExtension: focus.isWorkSessionExtension,
        extensionTrancheSeconds: focus.extensionTrancheSeconds,
        extensionBaselineCumulativeSeconds: focus.extensionBaselineCumulativeSeconds,
        extensionBaselineCount: focus.extensionBaselineCount,
        selectedTaskIds: [...focus.selectedTaskIds],
        activeTaskId: focus.activeTaskId,
        activeTaskIntervalStartedAtEpochMs: null,
      },
      timeOutStartedFact: createTimeOutStartedFact({
        factId: timeOutStartedFactId(focus.sessionId, focus.focusBlockIndex),
        recordedAt: nowEpochMs,
        workSessionId: focus.sessionId,
        focusBlockIndex: focus.focusBlockIndex,
        startedAtEpochMs: nowEpochMs,
        focusSecondsBeforeTimeOut: actualFocusSeconds,
      }),
    },
  };
};
