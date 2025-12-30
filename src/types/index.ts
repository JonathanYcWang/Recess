export interface SessionState {
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  totalTime: number;
  startTime?: number;
}

export interface BreakState {
  isActive: boolean;
  timeRemaining: number;
  selectedReward?: Reward;
}

export interface Reward {
  id: string;
  name: string;
  duration: string;
  icon?: string;
}

export interface WorkHours {
  id: string;
  timeRange: string;
  days: string[];
  enabled: boolean;
}

export interface Settings {
  blockedSites: string[];
  workHours: WorkHours[];
  sessionLength: number; // in minutes
  breakLength: number; // in minutes
}

