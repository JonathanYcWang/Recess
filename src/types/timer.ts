import { Reward } from './reward';

export type SessionState =
  | 'BEFORE_WORK_SESSION'
  | 'ONGOING_FOCUS_SESSION'
  | 'REWARD_SELECTION'
  | 'ONGOING_BREAK_SESSION'
  | 'FOCUS_SESSION_COUNTDOWN'
  | 'WORK_SESSION_COMPLETE';

export interface TimerState {
  sessionState: SessionState;
  isPaused: boolean;

  workSessionDurationRemaining: number;
  initialWorkSessionDuration: number;

  initialFocusSessionDuration: number;
  focusSessionDurationRemaining: number;
  focusSessionEntryTimeStamp?: number;

  initialBreakSessionDuration: number;
  breakSessionDurationRemaining: number;
  breakSessionEntryTimeStamp?: number;

  focusSessionCountdownTimeRemaining: number;
  initialFocusSessionCountdownDuration: number;
  focusSessionCountdownEntryTimeStamp?: number;

  rerolls: number;
  selectedReward: Reward | null;
  shownRewardCombinations: string[];

  nextFocusDuration: number;
  nextBreakDuration: number;
  lastFocusSessionCompleted: boolean;
  generatedRewards: Reward[];

  momentum: number;
  completedWorkMinutesToday: number;
  targetWorkMinutesToday: number;
  lastCompletedFocusSessionMinutes: number;

  fatigueWeightMultiplier: number;
  momentumWeightMultiplier: number;
}
