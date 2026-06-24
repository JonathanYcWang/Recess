import type { Result } from '@/modules/persisted-application-state/types';
import type {
  WorkRhythmFocusBlock,
  WorkRhythmTimeOut,
  WorkRhythmValue,
} from './workRhythmDocument';

export type ResumeFromTimeOutError = { kind: 'not-in-time-out' };

export interface ResumeFromTimeOutOutcome {
  nextValue: WorkRhythmFocusBlock;
  commandId: string;
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
      },
    },
  };
};
