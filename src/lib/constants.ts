// Timer constants (in seconds)
// Note: Focus and break times are now dynamically calculated based on momentum, fatigue, and progress
export const DEFAULT_BACK_TO_IT_TIME = 10; // 10 seconds
export const DEFAULT_REROLLS = 3;
export const DEFAULT_TOTAL_WORK_DURATION = 4.5 * 60 * 60; // 4.5 hours in seconds

// Reward constants (in minutes)
export const REWARD_TIME_INTERVAL = 5;
export const MAX_REWARD_TIME = 30;

// ============================================================================
// Dynamic Session Duration Calculation Constants
// ============================================================================

// CEWMA (Completion Exponentially Weighted Moving Average) Configuration
// Tracks momentum/likelihood of completing the next session
export const CEWMA_ALPHA = 0.5; // Weight for new session outcome (0.5 = halfway move)
export const CEWMA_STARTING_VALUE = 0.5; // Neutral starting point each day

// Fatigue Calculation Constants
export const SESSION_STRAIN_WEIGHT = 0.5; // How much recent session strain contributes to fatigue
export const FATIGUE_SESSION_SIZE_THRESHOLD = 0.5; // Sessions longer than 50% of daily target are "big"

// Focus Session Duration Formula: BASE + MOMENTUM_WEIGHT*M - FATIGUE_WEIGHT*F - PROGRESS_WEIGHT*P
// All durations in minutes
export const BASE_WORK_MINUTES = 10; // Minimum session length baseline
export const MOMENTUM_WORK_WEIGHT = 35; // Reward for completing sessions reliably
export const FATIGUE_WORK_WEIGHT = 25; // Main limiter - reduces duration when tired
export const PROGRESS_WORK_WEIGHT = 10; // Slight reduction as day progresses
export const MIN_WORK_SESSION_MINUTES = 5; // Hard minimum clamp for focus sessions

// Break Duration Formula: BASE + FATIGUE_WEIGHT*F + PROGRESS_WEIGHT*P + MOMENTUM_WEIGHT*M
// All durations in minutes
export const BASE_BREAK_MINUTES = 5; // Minimum break length baseline
export const FATIGUE_BREAK_WEIGHT = 10; // Main driver - longer breaks when fatigued
export const PROGRESS_BREAK_WEIGHT = 2; // Slightly longer breaks later in day
export const MOMENTUM_BREAK_WEIGHT = 4; // High momentum = safer to allow longer recovery
