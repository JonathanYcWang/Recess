import type { EnergyLevel, MomentumLevel } from '@/modules/workstyle-profile';
import type { SchedulerReason } from '@/modules/scheduler';

export const WORK_SESSION_GOAL_MIN_SECONDS = 15 * 60;
export const WORK_SESSION_GOAL_MAX_SECONDS = 8 * 60 * 60;
export const WORK_SESSION_GOAL_STEP_SECONDS = 15 * 60;
export const DEFAULT_WORK_SESSION_GOAL_SECONDS = 3 * 60 * 60;

export type WorkRhythmPhase =
  | 'inactive'
  | 'focus-block'
  | 'recess-prompt'
  | 'time-out'
  | 'work-session-completed'
  | 'reward-game'
  | 'recess'
  | 'back-to-work-countdown';

export interface WorkRhythmInactive {
  phase: 'inactive';
}

export const emptyTaskSelectionState = () => ({
  selectedTaskIds: [] as string[],
  activeTaskId: null as string | null,
  activeTaskIntervalStartedAtEpochMs: null as number | null,
});

export interface WorkRhythmFocusBlock {
  phase: 'focus-block';
  sessionId: string;
  originalGoalSeconds: number;
  sessionStartedAtEpochMs: number;
  remainingWorkSessionSeconds: number;
  settledRemainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockIndex: number;
  focusBlockStartedAtEpochMs: number;
  focusDeadlineAtEpochMs: number;
  focusDurationSeconds: number;
  isFinalFocus: boolean;
  wasExtension: boolean;
  schedulerReasons: SchedulerReason[];
  focusBlockStreak: number;
  settlementSegment: number;
  originalGoalPermanentlyComplete: boolean;
  isWorkSessionExtension: boolean;
  extensionTrancheSeconds: number;
  extensionBaselineCumulativeSeconds: number;
  extensionBaselineCount: number;
  selectedTaskIds: string[];
  activeTaskId: string | null;
  activeTaskIntervalStartedAtEpochMs: number | null;
}

export interface WorkRhythmWorkSessionCompleted {
  phase: 'work-session-completed';
  sessionId: string;
  originalGoalSeconds: number;
  cumulativeExtensionSeconds: number;
  extensionCount: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  lastCompletedFocusBlockIndex: number;
  originalGoalPermanentlyComplete: true;
  sessionCompletedAtEpochMs: number;
}

export interface WorkRhythmRecessPrompt {
  phase: 'recess-prompt';
  sessionId: string;
  originalGoalSeconds: number;
  sessionStartedAtEpochMs: number;
  settledRemainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  completedFocusBlockIndex: number;
  lastSettledSegment: number;
  deferredRecessCount: number;
  originalGoalPermanentlyComplete: boolean;
  isWorkSessionExtension: boolean;
  extensionTrancheSeconds: number;
  extensionBaselineCumulativeSeconds: number;
  extensionBaselineCount: number;
}

export interface WorkRhythmTimeOut {
  phase: 'time-out';
  sessionId: string;
  originalGoalSeconds: number;
  settledRemainingWorkSessionSeconds: number;
  settledRemainingFocusSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockIndex: number;
  focusDurationSeconds: number;
  isFinalFocus: boolean;
  wasExtension: boolean;
  schedulerReasons: SchedulerReason[];
  focusBlockStreak: number;
  settlementSegment: number;
  timeOutStartedAtEpochMs: number;
  lastReportedFiveMinuteBoundary: number;
  momentumLoweredDuringTimeOut: boolean;
  originalGoalPermanentlyComplete: boolean;
  isWorkSessionExtension: boolean;
  extensionTrancheSeconds: number;
  extensionBaselineCumulativeSeconds: number;
  extensionBaselineCount: number;
  selectedTaskIds: string[];
  activeTaskId: string | null;
  activeTaskIntervalStartedAtEpochMs: number | null;
}

export interface WorkRhythmRewardGame {
  phase: 'reward-game';
  sessionId: string;
  originalGoalSeconds: number;
  sessionStartedAtEpochMs: number;
  settledRemainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  completedFocusBlockIndex: number;
  roundId: string;
}

export interface WorkRhythmRecess {
  phase: 'recess';
  sessionId: string;
  originalGoalSeconds: number;
  sessionStartedAtEpochMs: number;
  settledRemainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  nextFocusBlockIndex: number;
  recessPassDestination: string | null;
  recessStartedAtEpochMs: number;
  recessDeadlineAtEpochMs: number;
  recessDurationSeconds: number;
  schedulerReasons: SchedulerReason[];
}

export interface WorkRhythmBackToWorkCountdown {
  phase: 'back-to-work-countdown';
  sessionId: string;
  originalGoalSeconds: number;
  sessionStartedAtEpochMs: number;
  settledRemainingWorkSessionSeconds: number;
  energy: EnergyLevel;
  momentum: MomentumLevel;
  focusBlockStreak: number;
  nextFocusBlockIndex: number;
  countdownStartedAtEpochMs: number;
  countdownDeadlineAtEpochMs: number;
}

export type WorkRhythmValue =
  | WorkRhythmInactive
  | WorkRhythmFocusBlock
  | WorkRhythmRecessPrompt
  | WorkRhythmTimeOut
  | WorkRhythmWorkSessionCompleted
  | WorkRhythmRewardGame
  | WorkRhythmRecess
  | WorkRhythmBackToWorkCountdown;

export const isWorkRhythmTimeOut = (value: WorkRhythmValue): value is WorkRhythmTimeOut =>
  value.phase === 'time-out';

export const isWorkRhythmWorkSessionCompleted = (
  value: WorkRhythmValue
): value is WorkRhythmWorkSessionCompleted => value.phase === 'work-session-completed';

export const BACK_TO_WORK_COUNTDOWN_SECONDS = 10;

export const createDefaultWorkRhythmValue = (): WorkRhythmInactive => ({
  phase: 'inactive',
});

export const isValidWorkSessionGoalSeconds = (seconds: number): boolean =>
  Number.isInteger(seconds) &&
  seconds >= WORK_SESSION_GOAL_MIN_SECONDS &&
  seconds <= WORK_SESSION_GOAL_MAX_SECONDS &&
  (seconds - WORK_SESSION_GOAL_MIN_SECONDS) % WORK_SESSION_GOAL_STEP_SECONDS === 0;

export const cloneWorkRhythmValue = (value: WorkRhythmValue): WorkRhythmValue => {
  if (value.phase === 'inactive') {
    return { phase: 'inactive' };
  }
  if (
    value.phase === 'recess-prompt' ||
    value.phase === 'work-session-completed' ||
    value.phase === 'reward-game' ||
    value.phase === 'back-to-work-countdown'
  ) {
    return { ...value };
  }
  if (value.phase === 'time-out') {
    return {
      ...value,
      selectedTaskIds: [...value.selectedTaskIds],
      schedulerReasons: value.schedulerReasons.map((reason) => ({ ...reason })),
    };
  }
  if (value.phase === 'recess') {
    return {
      ...value,
      schedulerReasons: value.schedulerReasons.map((reason) => ({ ...reason })),
    };
  }
  return {
    phase: 'focus-block',
    sessionId: value.sessionId,
    originalGoalSeconds: value.originalGoalSeconds,
    sessionStartedAtEpochMs: value.sessionStartedAtEpochMs,
    remainingWorkSessionSeconds: value.remainingWorkSessionSeconds,
    settledRemainingWorkSessionSeconds: value.settledRemainingWorkSessionSeconds,
    energy: value.energy,
    momentum: value.momentum,
    focusBlockIndex: value.focusBlockIndex,
    focusBlockStartedAtEpochMs: value.focusBlockStartedAtEpochMs,
    focusDeadlineAtEpochMs: value.focusDeadlineAtEpochMs,
    focusDurationSeconds: value.focusDurationSeconds,
    isFinalFocus: value.isFinalFocus,
    wasExtension: value.wasExtension,
    schedulerReasons: value.schedulerReasons.map((reason) => ({ ...reason })),
    focusBlockStreak: value.focusBlockStreak,
    settlementSegment: value.settlementSegment,
    originalGoalPermanentlyComplete: value.originalGoalPermanentlyComplete,
    isWorkSessionExtension: value.isWorkSessionExtension,
    extensionTrancheSeconds: value.extensionTrancheSeconds,
    extensionBaselineCumulativeSeconds: value.extensionBaselineCumulativeSeconds,
    extensionBaselineCount: value.extensionBaselineCount,
    selectedTaskIds: [...value.selectedTaskIds],
    activeTaskId: value.activeTaskId,
    activeTaskIntervalStartedAtEpochMs: value.activeTaskIntervalStartedAtEpochMs,
  };
};
