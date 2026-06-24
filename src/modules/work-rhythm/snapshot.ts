import type { EnergyLevel, MomentumLevel } from '@/modules/workstyle-profile';
import type { SchedulerReasonCode } from '@/modules/scheduler';
import { blocksUntilNextFocusBlockStreakMilestone } from './focusBlockStreak';
import { focusBlockWindDownContext, isWindDownActive } from './windDown';
import { remainingWorkSessionExtensionSeconds } from './workSessionExtension';
import type { WorkRhythmValue } from './workRhythmDocument';
import { remainingWorkSessionSecondsAt } from './acceptRecess';

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
  blocksUntilNextStreakMilestone: number;
  schedulerReasonCodes: SchedulerReasonCode[];
  windDownActive: boolean;
};

export type WorkRhythmRecessPromptSnapshot = {
  phase: 'recess-prompt';
  sessionId: string;
  originalGoalSeconds: number;
  remainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  blocksUntilNextStreakMilestone: number;
  deferredRecessCount: number;
  originalGoalPermanentlyComplete: boolean;
};

export type WorkRhythmTimeOutSnapshot = {
  phase: 'time-out';
  sessionId: string;
  originalGoalSeconds: number;
  remainingWorkSessionSeconds: number;
  remainingFocusSeconds: number;
  elapsedTimeOutSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  blocksUntilNextStreakMilestone: number;
  isFinalFocus: boolean;
};

export type WorkRhythmWorkSessionCompletedSnapshot = {
  phase: 'work-session-completed';
  sessionId: string;
  originalGoalSeconds: number;
  cumulativeExtensionSeconds: number;
  extensionCount: number;
  remainingExtensionAllowanceSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  blocksUntilNextStreakMilestone: number;
};

export type WorkRhythmRewardGameSnapshot = {
  phase: 'reward-game';
  sessionId: string;
  originalGoalSeconds: number;
  remainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  blocksUntilNextStreakMilestone: number;
  roundId: string;
};

export type WorkRhythmRecessSnapshot = {
  phase: 'recess';
  sessionId: string;
  originalGoalSeconds: number;
  remainingWorkSessionSeconds: number;
  remainingRecessSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  blocksUntilNextStreakMilestone: number;
  recessPassDestination: string | null;
  schedulerReasonCodes: SchedulerReasonCode[];
};

export type WorkRhythmBackToWorkCountdownSnapshot = {
  phase: 'back-to-work-countdown';
  sessionId: string;
  originalGoalSeconds: number;
  remainingWorkSessionSeconds: number;
  remainingCountdownSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  blocksUntilNextStreakMilestone: number;
};

export type WorkRhythmSnapshot =
  | WorkRhythmInactiveSnapshot
  | WorkRhythmFocusBlockSnapshot
  | WorkRhythmRecessPromptSnapshot
  | WorkRhythmTimeOutSnapshot
  | WorkRhythmWorkSessionCompletedSnapshot
  | WorkRhythmRewardGameSnapshot
  | WorkRhythmRecessSnapshot
  | WorkRhythmBackToWorkCountdownSnapshot;

export const projectWorkRhythmSnapshot = (
  value: WorkRhythmValue,
  nowEpochMs: number
): WorkRhythmSnapshot => {
  if (value.phase === 'inactive') {
    return { phase: 'inactive' };
  }

  if (value.phase === 'recess-prompt') {
    return {
      phase: 'recess-prompt',
      sessionId: value.sessionId,
      originalGoalSeconds: value.originalGoalSeconds,
      remainingWorkSessionSeconds: remainingWorkSessionSecondsAt(value, nowEpochMs),
      energy: value.energy,
      momentum: value.momentum,
      focusBlockStreak: value.focusBlockStreak,
      blocksUntilNextStreakMilestone: blocksUntilNextFocusBlockStreakMilestone(
        value.focusBlockStreak
      ),
      deferredRecessCount: value.deferredRecessCount,
      originalGoalPermanentlyComplete: value.originalGoalPermanentlyComplete,
    };
  }

  if (value.phase === 'work-session-completed') {
    return {
      phase: 'work-session-completed',
      sessionId: value.sessionId,
      originalGoalSeconds: value.originalGoalSeconds,
      cumulativeExtensionSeconds: value.cumulativeExtensionSeconds,
      extensionCount: value.extensionCount,
      remainingExtensionAllowanceSeconds: remainingWorkSessionExtensionSeconds(
        value.cumulativeExtensionSeconds
      ),
      energy: value.energy,
      momentum: value.momentum,
      focusBlockStreak: value.focusBlockStreak,
      blocksUntilNextStreakMilestone: blocksUntilNextFocusBlockStreakMilestone(
        value.focusBlockStreak
      ),
    };
  }

  if (value.phase === 'time-out') {
    const elapsedTimeOutSeconds = Math.max(
      0,
      Math.floor((nowEpochMs - value.timeOutStartedAtEpochMs) / 1000)
    );
    return {
      phase: 'time-out',
      sessionId: value.sessionId,
      originalGoalSeconds: value.originalGoalSeconds,
      remainingWorkSessionSeconds: value.settledRemainingWorkSessionSeconds,
      remainingFocusSeconds: value.settledRemainingFocusSeconds,
      elapsedTimeOutSeconds,
      energy: value.energy,
      momentum: value.momentum,
      focusBlockStreak: value.focusBlockStreak,
      blocksUntilNextStreakMilestone: blocksUntilNextFocusBlockStreakMilestone(
        value.focusBlockStreak
      ),
      isFinalFocus: value.isFinalFocus,
    };
  }

  if (value.phase === 'reward-game') {
    return {
      phase: 'reward-game',
      sessionId: value.sessionId,
      originalGoalSeconds: value.originalGoalSeconds,
      remainingWorkSessionSeconds: remainingWorkSessionSecondsAt(value, nowEpochMs),
      energy: value.energy,
      momentum: value.momentum,
      focusBlockStreak: value.focusBlockStreak,
      blocksUntilNextStreakMilestone: blocksUntilNextFocusBlockStreakMilestone(
        value.focusBlockStreak
      ),
      roundId: value.roundId,
    };
  }

  if (value.phase === 'recess') {
    const remainingRecessSeconds = Math.max(
      0,
      Math.ceil((value.recessDeadlineAtEpochMs - nowEpochMs) / 1000)
    );
    return {
      phase: 'recess',
      sessionId: value.sessionId,
      originalGoalSeconds: value.originalGoalSeconds,
      remainingWorkSessionSeconds: remainingWorkSessionSecondsAt(value, nowEpochMs),
      remainingRecessSeconds,
      energy: value.energy,
      momentum: value.momentum,
      focusBlockStreak: value.focusBlockStreak,
      blocksUntilNextStreakMilestone: blocksUntilNextFocusBlockStreakMilestone(
        value.focusBlockStreak
      ),
      recessPassDestination: value.recessPassDestination,
      schedulerReasonCodes: value.schedulerReasons.map((reason) => reason.code),
    };
  }

  if (value.phase === 'back-to-work-countdown') {
    const remainingCountdownSeconds = Math.max(
      0,
      Math.ceil((value.countdownDeadlineAtEpochMs - nowEpochMs) / 1000)
    );
    return {
      phase: 'back-to-work-countdown',
      sessionId: value.sessionId,
      originalGoalSeconds: value.originalGoalSeconds,
      remainingWorkSessionSeconds: remainingWorkSessionSecondsAt(value, nowEpochMs),
      remainingCountdownSeconds,
      energy: value.energy,
      momentum: value.momentum,
      focusBlockStreak: value.focusBlockStreak,
      blocksUntilNextStreakMilestone: blocksUntilNextFocusBlockStreakMilestone(
        value.focusBlockStreak
      ),
    };
  }

  const remainingFocusSeconds = Math.max(
    0,
    Math.ceil((value.focusDeadlineAtEpochMs - nowEpochMs) / 1000)
  );
  const windDownContext = focusBlockWindDownContext(value);

  return {
    phase: 'focus-block',
    sessionId: value.sessionId,
    originalGoalSeconds: value.originalGoalSeconds,
    remainingWorkSessionSeconds: remainingWorkSessionSecondsAt(value, nowEpochMs),
    remainingFocusSeconds,
    energy: value.energy,
    momentum: value.momentum,
    isFinalFocus: value.isFinalFocus,
    focusBlockStreak: value.focusBlockStreak,
    blocksUntilNextStreakMilestone: blocksUntilNextFocusBlockStreakMilestone(
      value.focusBlockStreak
    ),
    schedulerReasonCodes: value.schedulerReasons.map((reason) => reason.code),
    windDownActive: isWindDownActive(windDownContext, nowEpochMs),
  };
};
