import type { Result } from '@/modules/persisted-application-state/types';
import { computeActualFocusSeconds } from './settleFocusBoundary';
import type {
  WorkRhythmFocusBlock,
  WorkRhythmTimeOut,
  WorkRhythmValue,
} from './workRhythmDocument';

export type StartTimeOutError =
  | { kind: 'invalid-phase-for-time-out' }
  | { kind: 'already-in-time-out' };

export interface StartTimeOutOutcome {
  nextValue: WorkRhythmTimeOut;
  commandId: string;
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
      },
    },
  };
};
