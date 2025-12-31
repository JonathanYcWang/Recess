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
}

export interface WorkHoursEntry {
  id: string;
  startTime: string;
  endTime: string;
  days: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  enabled: boolean;
}

