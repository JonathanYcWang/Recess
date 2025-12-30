// Shared types for timer/session state management

export type SessionState = 
  | 'BEFORE_SESSION'
  | 'DURING_SESSION'
  | 'PAUSED'
  | 'REWARD_SELECTION'
  | 'BREAK'
  | 'BACK_TO_IT';

export interface Reward {
  id: string;
  name: string;
  duration: string;
}

