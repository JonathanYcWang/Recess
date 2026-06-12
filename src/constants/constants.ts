export const DEFAULT_WORK_SESSION_DURATION = 3 * 60 * 60;

export const NOTIFY_TIME_LEFT_SECONDS = 5 * 60; // Notify when 5 minutes are left in a session

export const MAX_REWARD_TIME = 30; // Maximum reward duration
export const DEFAULT_REROLLS = 3;

export const CEWMA_ALPHA = 0.5;
export const MAX_FOCUS_SESSION_DURATION = 60 * 60;
export const MIN_FOCUS_SESSION_DURATION = 15 * 60;

export const MAX_BREAK_DURATION = 20 * 60;
export const MIN_BREAK_DURATION = 5 * 60;

export const FINAL_STRETCH_THRESHOLD = 0.15;

export const FOCUS_COUNTDOWN_DURATION = 10;

export const MAX_REWARD_GENERATION_RETRIES = 5000;

export const SESSION_STATES = {
  ONGOING_FOCUS_SESSION: 'ONGOING_FOCUS_SESSION',
  ONGOING_BREAK_SESSION: 'ONGOING_BREAK_SESSION',
  FOCUS_SESSION_COUNTDOWN: 'FOCUS_SESSION_COUNTDOWN',
  REWARD_SELECTION: 'REWARD_SELECTION',
  BEFORE_WORK_SESSION: 'BEFORE_WORK_SESSION',
  WORK_SESSION_COMPLETE: 'WORK_SESSION_COMPLETE',
} as const;

export type SessionState = (typeof SESSION_STATES)[keyof typeof SESSION_STATES];

export const SEGMENT_COUNT = 8;
export const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;
export const MAX_SPEED = 0.5;
export const DECEL_FACTOR = 0.99;
export const ACCEL_FACTOR = 0.07;
export const TICKER_MAX_TILT = 20;
export const WHEEL_SIZE = 320;
export const WHEEL_PADDING = 60;
export const WHEEL_RADIUS = WHEEL_SIZE / 2;
export const RING_SIZE = WHEEL_SIZE + WHEEL_PADDING;
export const RING_CENTER = RING_SIZE / 2;
export const RING_RADIUS = WHEEL_RADIUS + 24;
export const TICKER_WIDTH = 28;
export const TICKER_CAP_WHEEL_RADIUS = 4;
export const INNER_RADIUS = WHEEL_RADIUS * 0.18;
export const ICON_RADIUS = WHEEL_RADIUS * 0.62;

export const SPIN_ROTATIONS = 4;

export const BASE_REEL_SPIN_DURATION_SECONDS = 2;
export const REEL_STOP_INTERVAL_SECONDS = 2.2;
