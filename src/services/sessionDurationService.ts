import {
  CEWMA_ALPHA,
  SESSION_STRAIN_WEIGHT,
  FATIGUE_SESSION_SIZE_THRESHOLD,
  BASE_WORK,
  MOMENTUM_WORK_WEIGHT,
  FATIGUE_WORK_WEIGHT,
  PROGRESS_WORK_WEIGHT,
  BASE_BREAK,
  FATIGUE_BREAK_WEIGHT,
  PROGRESS_BREAK_WEIGHT,
  MOMENTUM_BREAK_WEIGHT,
} from '../constants/constants';

export const calculateProgress = (totalTimer: number, totalRemainingTime: number): number => {
  if (totalTimer <= 0) return 0;
  return (totalTimer - totalRemainingTime) / totalTimer;
};

export const updateCEWMA = (currentCEWMA: number, sessionCompleted: boolean): number => {
  const c = sessionCompleted ? 1 : 0;
  return CEWMA_ALPHA * c + (1 - CEWMA_ALPHA) * currentCEWMA;
};

// export const calculateFatigue = (
//   totalTimer: number,
//   lastCompletedSessionSeconds: number,
//   progress: number
// ): number => {
//   if (totalTimer <= 0) return 0;

//   // Base fatigue from total work accumulation (unitless ratio)
//   const fatigueBase = Math.pow(progress, 2);

//   // Recent session strain
//   const sessionSizeThreshold = FATIGUE_SESSION_SIZE_THRESHOLD * totalTimer;
//   const sessionStrainRatio = lastCompletedSessionSeconds / sessionSizeThreshold;
//   const sessionStrain = Math.pow(sessionStrainRatio, 2);

//   // Combine base fatigue with weighted session strain
//   return fatigueBase + SESSION_STRAIN_WEIGHT * sessionStrain;
// };

export const calculateFatigue = (
  totalTimer: number,
  totalTimerRemaining: number,
  lastCompletedFocusSessionSeconds: number,
  lastFocusSessionCompleted: boolean
): number => {
  const workStarted = lastFocusSessionCompleted || lastCompletedFocusSessionSeconds > 0;
  if (!workStarted) return 0;

  const durationFactor = Math.min(totalTimer / 480, 1) * 100;
  const dayProgressFactor = totalTimer > 0 ? (1 - totalTimerRemaining / totalTimer) * 100 : 0;
  const incompletionPenalty = lastFocusSessionCompleted ? 0 : 100;
  const sessionEffortFactor = Math.min(lastCompletedFocusSessionSeconds / 90, 1) * 100;

  return Math.round(
    0.4 * durationFactor +
      0.25 * dayProgressFactor +
      0.2 * incompletionPenalty +
      0.15 * sessionEffortFactor
  );
};

export const calculateFocusSessionDuration = (
  momentum: number,
  fatigue: number,
  progress: number,
  momentumWeightMultiplier: number = 1.0,
  fatigueWeightMultiplier: number = 1.0
): number => {
  const duration =
    BASE_WORK +
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
    BASE_BREAK +
    FATIGUE_BREAK_WEIGHT * fatigueWeightMultiplier * fatigue +
    PROGRESS_BREAK_WEIGHT * progress +
    MOMENTUM_BREAK_WEIGHT * momentumWeightMultiplier * momentum;

  return duration;
};
