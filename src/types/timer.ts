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

  // Work session tracking
  totalTimer: number; // Total work goal for this session
  totalRemaining: number; // How much work time is left

  // Current stage (focus/break/countdown) timing
  currentTimer: number; // Original stage duration (never mutates during session)
  currentTimerRemaining: number; // Remaining time in current stage (used when paused or for elapsed calculation)
  currentStartTime?: number;

  rerolls: number;
  selectedReward: Reward | null;
  shownRewardCombinations: string[];

  lastFocusSessionCompleted: boolean;
  generatedRewards: Reward[];

  momentum: number;
  lastCompletedFocusSessionSeconds: number;

  fatigueWeightMultiplier: number;
  momentumWeightMultiplier: number;
}
