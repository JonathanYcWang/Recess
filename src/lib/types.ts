// Shared types for timer/session state management

export type SessionState =
  | 'BEFORE_SESSION'
  | 'DURING_SESSION'
  | 'PAUSED'
  | 'REWARD_SELECTION'
  | 'BREAK'
  | 'BACK_TO_IT'
  | 'SESSION_COMPLETE';

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

  // Requested Variables
  workSessionDurationRemaining: number;
  initialWorkSessionDuration: number;
  initialFocusSessionDuration: number;
  initialBreakSessionDuration: number;
  focusSessionDurationRemaining: number;
  breakSessionDurationRemaining: number;
  focusSessionEntryTimeStamp?: number;
  breakSessionEntryTimeStamp?: number;

  // Other necessary state
  backToItTimeRemaining: number;
  rerolls: number;
  selectedReward: Reward | null;
  pausedFrom: 'DURING_SESSION' | 'BACK_TO_IT' | null;

  // Dynamic variables
  nextFocusDuration: number;
  nextBreakDuration: number;
  lastFocusSessionCompleted: boolean;
  generatedRewards: Reward[];

  // Dynamic Session Duration Tracking
  // CEWMA (Completion Exponentially Weighted Moving Average) - momentum/likelihood of completing next session
  momentum: number; // 0.0 to 1.0, starts at 0.5 each day

  // Work tracking (all in minutes)
  completedWorkMinutesToday: number; // Total work completed today (W)
  targetWorkMinutesToday: number; // User's daily work target (T)
  lastCompletedSessionMinutes: number; // Length of most recent completed focus session
}
