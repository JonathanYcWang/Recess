// ============================================================================
// TIMER CONSTANTS
// ============================================================================

// Focus session countdown transition period (in seconds)
// Time given to user to prepare before re-entering focus session
export const DEFAULT_FOCUS_SESSION_COUNTDOWN_TIME = 10;

// Daily work session target (in seconds)
// Total duration user aims to work during the day
export const DEFAULT_WORK_SESSION_DURATION = 4.5 * 60 * 60; // 4.5 hours

// ============================================================================
// REWARD SYSTEM CONSTANTS
// ============================================================================

// Reward duration parameters (in minutes)
export const REWARD_TIME_INTERVAL = 5; // Rewards are multiples of 5 minutes
export const MAX_REWARD_TIME = 30; // Maximum reward duration

// Number of reward rerolls available per session
export const DEFAULT_REROLLS = 3;

// ============================================================================
// DYNAMIC SESSION DURATION CALCULATION
// ============================================================================

/**
 * MOMENTUM TRACKING (CEWMA - Completion Exponentially Weighted Moving Average)
 *
 * Momentum tracks how reliably the user completes focus sessions.
 * Higher momentum = user is in a flow state and can handle longer sessions.
 * Lower momentum = user is struggling and needs shorter, more achievable sessions.
 */

// Weight for new session outcomes in CEWMA calculation
// 0.5 = each new session moves momentum halfway toward the outcome (1 for complete, 0 for abandoned)
export const CEWMA_ALPHA = 0.5;

// Starting momentum value each day (neutral starting point)
export const CEWMA_STARTING_VALUE = 0.5;

/**
 * FATIGUE CALCULATION
 *
 * Fatigue increases as the user works longer during the day.
 * It considers both total accumulated work and recent session intensity.
 * Higher fatigue = shorter focus sessions and longer breaks.
 */

// How much recent session strain contributes to overall fatigue
export const SESSION_STRAIN_WEIGHT = 0.5;

// Sessions longer than this percentage of daily target are considered "big" and increase strain
export const FATIGUE_SESSION_SIZE_THRESHOLD = 0.5; // 50% of daily target

/**
 * FOCUS SESSION DURATION FORMULA
 *
 * Duration = BASE + MOMENTUM_WEIGHT × M - FATIGUE_WEIGHT × F - PROGRESS_WEIGHT × P
 *
 * Where:
 * - M = momentum (0 to 1)
 * - F = fatigue (0 to 1+)
 * - P = progress toward daily goal (0 to 1+)
 */

export const BASE_WORK_MINUTES = 10; // Minimum baseline session length
export const MOMENTUM_WORK_WEIGHT = 35; // Reward for high completion rate
export const FATIGUE_WORK_WEIGHT = 25; // Primary limiter based on tiredness
export const PROGRESS_WORK_WEIGHT = 10; // Slight reduction as day progresses
export const MIN_WORK_SESSION_MINUTES = 5; // Hard floor for session length

/**
 * BREAK DURATION FORMULA
 *
 * Duration = BASE + FATIGUE_WEIGHT × F + PROGRESS_WEIGHT × P + MOMENTUM_WEIGHT × M
 *
 * Breaks get longer when fatigued and as the day progresses.
 * High momentum allows longer breaks (user has "earned" more recovery time).
 */

export const BASE_BREAK_MINUTES = 5; // Minimum baseline break length
export const FATIGUE_BREAK_WEIGHT = 10; // Primary driver of break length
export const PROGRESS_BREAK_WEIGHT = 2; // Longer breaks later in day
export const MOMENTUM_BREAK_WEIGHT = 4; // High momentum = can afford longer recovery
