import {
  CEWMA_ALPHA,
  SESSION_STRAIN_WEIGHT,
  FATIGUE_SESSION_SIZE_THRESHOLD,
  BASE_WORK_MINUTES,
  MOMENTUM_WORK_WEIGHT,
  FATIGUE_WORK_WEIGHT,
  PROGRESS_WORK_WEIGHT,
  BASE_BREAK_MINUTES,
  FATIGUE_BREAK_WEIGHT,
  PROGRESS_BREAK_WEIGHT,
  MOMENTUM_BREAK_WEIGHT,
} from '../constants/constants';

export const calculateProgress = (totalTimer: number, totalRemainingTime: number): number => {
  if (totalTimer <= 0) return 0;
  return (totalTimer - totalRemainingTime) / totalTimer;
};

/**
 * Update CEWMA (Completion Exponentially Weighted Moving Average) after a session
 * Formula: C_ewma ← α*c + (1-α)*C_ewma
 *
 * @param currentCEWMA - Current momentum score (0.0 to 1.0)
 * @param sessionCompleted - Whether the session was completed (true) or abandoned (false)
 * @returns Updated CEWMA value (0.0 to 1.0)
 */
export const updateCEWMA = (currentCEWMA: number, sessionCompleted: boolean): number => {
  const c = sessionCompleted ? 1 : 0;
  return CEWMA_ALPHA * c + (1 - CEWMA_ALPHA) * currentCEWMA;
};

export const calculateFatigue = (
  totalTimer: number,
  totalRemainingTime: number,
  lastCompletedSessionSeconds: number
): number => {
  if (totalTimer <= 0) return 0;

  // Base fatigue from total work accumulation (unitless ratio)
  const progressRatio = (totalTimer - totalRemainingTime) / totalTimer;
  const fatigueBase = Math.pow(progressRatio, 2);

  // Recent session strain (sessions longer than half the daily target are "big")
  const sessionSizeThreshold = FATIGUE_SESSION_SIZE_THRESHOLD * totalTimer;
  const sessionStrainRatio = lastCompletedSessionSeconds / sessionSizeThreshold;
  const sessionStrain = Math.pow(sessionStrainRatio, 2);

  // Combine base fatigue with weighted session strain
  return fatigueBase + SESSION_STRAIN_WEIGHT * sessionStrain;
};

export const calculateFocusSessionDuration = (
  momentum: number,
  fatigue: number,
  progress: number,
  momentumWeightMultiplier: number = 1.0,
  fatigueWeightMultiplier: number = 1.0
): number => {
  const duration =
    BASE_WORK_MINUTES * 60 +
    MOMENTUM_WORK_WEIGHT * momentumWeightMultiplier * momentum -
    FATIGUE_WORK_WEIGHT * fatigueWeightMultiplier * fatigue -
    PROGRESS_WORK_WEIGHT * progress;

  return duration;
};

export const calculateBreakDuration = (
  fatigue: number,
  progress: number,
  momentum: number,
  fatigueWeightMultiplier: number = 1.0,
  momentumWeightMultiplier: number = 1.0
): number => {
  const duration =
    BASE_BREAK_MINUTES * 60 +
    FATIGUE_BREAK_WEIGHT * fatigueWeightMultiplier * fatigue +
    PROGRESS_BREAK_WEIGHT * progress +
    MOMENTUM_BREAK_WEIGHT * momentumWeightMultiplier * momentum;

  return duration;
};

export const secondsToMinutes = (seconds: number): number => {
  return Math.round(seconds / 60);
};
