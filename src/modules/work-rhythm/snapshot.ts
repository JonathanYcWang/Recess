import type { EnergyLevel, MomentumLevel } from '@/modules/workstyle-profile';
import type { SchedulerReasonCode } from '@/modules/scheduler';
import type { WorkRhythmValue } from './workRhythmDocument';

export type WorkRhythmInactiveSnapshot = {
  phase: 'inactive';
};

export type WorkRhythmFocusBlockSnapshot = {
  phase: 'focus-block';
  sessionId: string;
  originalGoalSeconds: number;
  remainingWorkSessionSeconds: number;
  remainingFocusSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  isFinalFocus: boolean;
  focusBlockStreak: number;
  schedulerReasonCodes: SchedulerReasonCode[];
};

export type WorkRhythmRecessPromptSnapshot = {
  phase: 'recess-prompt';
  sessionId: string;
  originalGoalSeconds: number;
  remainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  deferredRecessCount: number;
  originalGoalPermanentlyComplete: boolean;
};

export type WorkRhythmSnapshot =
  | WorkRhythmInactiveSnapshot
  | WorkRhythmFocusBlockSnapshot
  | WorkRhythmRecessPromptSnapshot;

export const projectWorkRhythmSnapshot = (
  value: WorkRhythmValue,
  nowEpochMs: number
): WorkRhythmSnapshot => {
  if (value.phase === 'inactive') {
    return { phase: 'inactive' };
  }

  if (value.phase === 'recess-prompt') {
    const elapsedWorkSeconds = Math.max(
      0,
      Math.floor((nowEpochMs - value.sessionStartedAtEpochMs) / 1000)
    );
    const remainingWorkSessionSeconds = Math.max(
      0,
      value.settledRemainingWorkSessionSeconds - elapsedWorkSeconds
    );
    return {
      phase: 'recess-prompt',
      sessionId: value.sessionId,
      originalGoalSeconds: value.originalGoalSeconds,
      remainingWorkSessionSeconds,
      energy: value.energy,
      momentum: value.momentum,
      focusBlockStreak: value.focusBlockStreak,
      deferredRecessCount: value.deferredRecessCount,
      originalGoalPermanentlyComplete: value.originalGoalPermanentlyComplete,
    };
  }

  const remainingFocusSeconds = Math.max(
    0,
    Math.ceil((value.focusDeadlineAtEpochMs - nowEpochMs) / 1000)
  );
  const elapsedWorkSeconds = Math.max(
    0,
    Math.floor((nowEpochMs - value.sessionStartedAtEpochMs) / 1000)
  );
  const remainingWorkSessionSeconds = Math.max(
    0,
    value.settledRemainingWorkSessionSeconds - elapsedWorkSeconds
  );

  return {
    phase: 'focus-block',
    sessionId: value.sessionId,
    originalGoalSeconds: value.originalGoalSeconds,
    remainingWorkSessionSeconds,
    remainingFocusSeconds,
    energy: value.energy,
    momentum: value.momentum,
    isFinalFocus: value.isFinalFocus,
    focusBlockStreak: value.focusBlockStreak,
    schedulerReasonCodes: value.schedulerReasons.map((reason) => reason.code),
  };
};
