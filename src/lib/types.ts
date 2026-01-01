// Shared types for timer/session state management

export type SessionState =
  | 'BEFORE_WORK_SESSION'
  | 'ONGOING_FOCUS_SESSION'
  | 'REWARD_SELECTION'
  | 'ONGOING_BREAK_SESSION'
  | 'FOCUS_SESSION_COUNTDOWN'
  | 'WORK_SESSION_COMPLETE';

export interface Reward {
  id: string;
  name: string;
  duration: string;
  durationSeconds: number;
}

export interface WorkHoursEntry {
  id: string;
  startTime: string;
  endTime: string;
  days: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  enabled: boolean;
}

export interface TimerState {
  sessionState: SessionState;
  isPaused: boolean;

  // Work Session - Total duration user will work today
  workSessionDurationRemaining: number;
  initialWorkSessionDuration: number;

  // Focus Session - Individual work periods between breaks
  initialFocusSessionDuration: number;
  focusSessionDurationRemaining: number;
  focusSessionEntryTimeStamp?: number;

  // Break Session - Rest periods between focus sessions
  initialBreakSessionDuration: number;
  breakSessionDurationRemaining: number;
  breakSessionEntryTimeStamp?: number;

  // Focus Session Countdown - Transition period before returning to focus
  focusSessionCountdownTimeRemaining: number;
  initialFocusSessionCountdownDuration: number;
  focusSessionCountdownEntryTimeStamp?: number;

  // Reward system
  rerolls: number;
  selectedReward: Reward | null;
  generatedRewards: Reward[];

  // Next session durations (pre-calculated)
  nextFocusDuration: number;
  nextBreakDuration: number;
  lastFocusSessionCompleted: boolean;

  // Dynamic Session Duration Tracking
  // CEWMA (Completion Exponentially Weighted Moving Average) - momentum/likelihood of completing next session
  momentum: number; // 0.0 to 1.0, starts at 0.5 each day

  // Work tracking (all in minutes)
  completedWorkMinutesToday: number; // Total work completed today (W)
  targetWorkMinutesToday: number; // User's daily work target (T)
  lastCompletedFocusSessionMinutes: number; // Length of most recent completed focus session

  // Weight multipliers for dynamic adjustment based on user feedback
  fatigueWeightMultiplier: number; // Multiplier for fatigue weight (1.0 = default, 1.5 = 50% increase)
  momentumWeightMultiplier: number; // Multiplier for momentum weight (1.0 = default, 1.5 = 50% increase)
}
