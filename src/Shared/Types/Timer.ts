import { SessionState } from '../Constants/Constants';
import { Reward } from './reward';

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

  momentumScore: number;
  fatigueScore: number;
  lastFocusSessionDuration: number;

  feedbackMultiplier: number;
}
