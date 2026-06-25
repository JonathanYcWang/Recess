import type { Result } from '@/modules/persisted-application-state/types';
import { createTimeOutEndedFact, timeOutEndedFactId } from './timeOutEnded';
import type {
  WorkRhythmFocusBlock,
  WorkRhythmTimeOut,
  WorkRhythmValue,
} from './workRhythmDocument';
import type { WorkHistoryFact } from '@/modules/work-history';

export type ResumeFromTimeOutError = { kind: 'not-in-time-out' };

export interface ResumeFromTimeOutOutcome {
  nextValue: WorkRhythmFocusBlock;
  commandId: string;
  timeOutEndedFact: WorkHistoryFact;
}

export const resumeFromTimeOutCommandId = (sessionId: string): string =>
  `resume-from-time-out-${sessionId}`;

export const decideResumeFromTimeOut = (
  current: WorkRhythmValue,
  nowEpochMs: number
): Result<ResumeFromTimeOutOutcome, ResumeFromTimeOutError> => {
  if (current.phase !== 'time-out') {
    return { ok: false, error: { kind: 'not-in-time-out' } };
  }

  const timeOut = current as WorkRhythmTimeOut;
  const focusDurationSeconds = timeOut.settledRemainingFocusSeconds;
  const focusDeadlineAtEpochMs = nowEpochMs + focusDurationSeconds * 1000;
  const durationSeconds = Math.max(
    0,
    Math.floor((nowEpochMs - timeOut.timeOutStartedAtEpochMs) / 1000)
  );

  return {
    ok: true,
    value: {
      commandId: resumeFromTimeOutCommandId(timeOut.sessionId),
      nextValue: {
        phase: 'focus-block',
        sessionId: timeOut.sessionId,
        originalGoalSeconds: timeOut.originalGoalSeconds,
        sessionStartedAtEpochMs: nowEpochMs,
        remainingWorkSessionSeconds: timeOut.settledRemainingWorkSessionSeconds,
        settledRemainingWorkSessionSeconds: timeOut.settledRemainingWorkSessionSeconds,
        energy: timeOut.energy,
        momentum: timeOut.momentum,
        focusBlockIndex: timeOut.focusBlockIndex,
        focusBlockStartedAtEpochMs: nowEpochMs,
        focusDeadlineAtEpochMs,
        focusDurationSeconds,
        isFinalFocus: timeOut.isFinalFocus,
        wasExtension: timeOut.wasExtension,
        schedulerReasons: timeOut.schedulerReasons.map((reason) => ({ ...reason })),
        focusBlockStreak: timeOut.focusBlockStreak,
        settlementSegment: timeOut.settlementSegment,
        originalGoalPermanentlyComplete: timeOut.originalGoalPermanentlyComplete,
        isWorkSessionExtension: timeOut.isWorkSessionExtension,
        extensionTrancheSeconds: timeOut.extensionTrancheSeconds,
        extensionBaselineCumulativeSeconds: timeOut.extensionBaselineCumulativeSeconds,
        extensionBaselineCount: timeOut.extensionBaselineCount,
        selectedTaskIds: [...timeOut.selectedTaskIds],
        activeTaskId: timeOut.activeTaskId,
        activeTaskIntervalStartedAtEpochMs: timeOut.activeTaskId !== null ? nowEpochMs : null,
      },
      timeOutEndedFact: createTimeOutEndedFact({
        factId: timeOutEndedFactId(
          timeOut.sessionId,
          timeOut.focusBlockIndex,
          timeOut.timeOutStartedAtEpochMs
        ),
        recordedAt: nowEpochMs,
        workSessionId: timeOut.sessionId,
        focusBlockIndex: timeOut.focusBlockIndex,
        startedAtEpochMs: timeOut.timeOutStartedAtEpochMs,
        endedAtEpochMs: nowEpochMs,
        durationSeconds,
      }),
    },
  };
};
