/**
 * Pure calculation module for dynamic focus session and break duration logic.
 *
 * All formulas are implemented exactly as specified in dynamic-session-duration-calculations.md
 * No React, no side effects - just math with explicit inputs and outputs.
 */

import {
  CEWMA_ALPHA,
  CEWMA_STARTING_VALUE,
  SESSION_STRAIN_WEIGHT,
  FATIGUE_SESSION_SIZE_THRESHOLD,
  BASE_WORK_MINUTES,
  MOMENTUM_WORK_WEIGHT,
  FATIGUE_WORK_WEIGHT,
  PROGRESS_WORK_WEIGHT,
  MIN_WORK_SESSION_MINUTES,
  BASE_BREAK_MINUTES,
  FATIGUE_BREAK_WEIGHT,
  PROGRESS_BREAK_WEIGHT,
  MOMENTUM_BREAK_WEIGHT,
} from './constants';

/**
 * Calculate progress toward daily work target
 * P = W / T
 *
 * @param completedWorkMinutes - Total work minutes completed today (W)
 * @param targetWorkMinutes - User's target work minutes for today (T)
 * @returns Progress ratio (0.0 to 1.0+, can exceed 1.0 if working past target)
 */
export function calculateProgress(completedWorkMinutes: number, targetWorkMinutes: number): number {
  if (targetWorkMinutes <= 0) return 0;
  return completedWorkMinutes / targetWorkMinutes;
}

/**
 * Update CEWMA (Completion Exponentially Weighted Moving Average) after a session
 * Formula: C_ewma ← α*c + (1-α)*C_ewma
 *
 * @param currentCEWMA - Current momentum score (0.0 to 1.0)
 * @param sessionCompleted - Whether the session was completed (true) or abandoned (false)
 * @returns Updated CEWMA value (0.0 to 1.0)
 */
export function updateCEWMA(currentCEWMA: number, sessionCompleted: boolean): number {
  const c = sessionCompleted ? 1 : 0;
  return CEWMA_ALPHA * c + (1 - CEWMA_ALPHA) * currentCEWMA;
}

/**
 * Get initial CEWMA value for start of day
 * @returns Starting neutral momentum value
 */
export function getInitialCEWMA(): number {
  return CEWMA_STARTING_VALUE;
}

/**
 * Calculate fatigue score based on total work completed and recent session strain
 *
 * Formulas:
 * - fatigue_base = (W / T)^2
 * - session_strain = (last_completed_work_minutes / (0.5*T))^2
 * - fatigue = fatigue_base + SESSION_STRAIN_WEIGHT * session_strain
 *
 * @param completedWorkMinutes - Total work minutes completed today (W)
 * @param targetWorkMinutes - User's target work minutes for today (T)
 * @param lastCompletedSessionMinutes - Length of most recent completed session
 * @returns Fatigue score (0.0 to 1.0+, can exceed 1.0 if working past target)
 */
export function calculateFatigue(
  completedWorkMinutes: number,
  targetWorkMinutes: number,
  lastCompletedSessionMinutes: number
): number {
  if (targetWorkMinutes <= 0) return 0;

  // Base fatigue from total work accumulation
  const progressRatio = completedWorkMinutes / targetWorkMinutes;
  const fatigueBase = Math.pow(progressRatio, 2);

  // Recent session strain (sessions longer than half the daily target are "big")
  const sessionSizeThreshold = FATIGUE_SESSION_SIZE_THRESHOLD * targetWorkMinutes;
  const sessionStrainRatio = lastCompletedSessionMinutes / sessionSizeThreshold;
  const sessionStrain = Math.pow(sessionStrainRatio, 2);

  // Combine base fatigue with weighted session strain
  return fatigueBase + SESSION_STRAIN_WEIGHT * sessionStrain;
}

/**
 * Calculate next focus session duration using momentum, fatigue, and progress
 *
 * Formula: work_session_minutes = BASE + MOMENTUM_WEIGHT*M - FATIGUE_WEIGHT*F - PROGRESS_WEIGHT*P
 *
 * @param momentum - CEWMA value (0.0 to 1.0) - likelihood of completing next session
 * @param fatigue - Fatigue score (0.0 to 1.0+)
 * @param progress - Progress toward daily target (0.0 to 1.0+)
 * @returns Focus session duration in minutes (clamped to minimum)
 */
export function calculateFocusSessionDuration(
  momentum: number,
  fatigue: number,
  progress: number
): number {
  const duration =
    BASE_WORK_MINUTES +
    MOMENTUM_WORK_WEIGHT * momentum -
    FATIGUE_WORK_WEIGHT * fatigue -
    PROGRESS_WORK_WEIGHT * progress;

  // Enforce minimum duration
  return Math.max(MIN_WORK_SESSION_MINUTES, duration);
}

/**
 * Calculate next break duration using fatigue, progress, and momentum
 *
 * Formula: break_minutes = BASE + FATIGUE_WEIGHT*F + PROGRESS_WEIGHT*P + MOMENTUM_WEIGHT*M
 *
 * Naturally results in longer breaks after longer/more fatiguing sessions
 *
 * @param fatigue - Fatigue score (0.0 to 1.0+) - main driver of break length
 * @param progress - Progress toward daily target (0.0 to 1.0+)
 * @param momentum - CEWMA value (0.0 to 1.0) - higher momentum = safer to allow longer recovery
 * @returns Break duration in minutes
 */
export function calculateBreakDuration(
  fatigue: number,
  progress: number,
  momentum: number
): number {
  const duration =
    BASE_BREAK_MINUTES +
    FATIGUE_BREAK_WEIGHT * fatigue +
    PROGRESS_BREAK_WEIGHT * progress +
    MOMENTUM_BREAK_WEIGHT * momentum;

  // No minimum clamp needed - BASE_BREAK_MINUTES already defines the floor
  return duration;
}

/**
 * Helper to convert seconds to minutes
 */
export function secondsToMinutes(seconds: number): number {
  return seconds / 60;
}

/**
 * Helper to convert minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}
