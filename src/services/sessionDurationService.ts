import {
  CEWMA_ALPHA,
  FINAL_STRETCH_THRESHOLD,
  MAX_FOCUS_SESSION_DURATION,
  MIN_FOCUS_SESSION_DURATION,
  MAX_BREAK_DURATION,
  MIN_BREAK_DURATION,
} from '../constants/constants';

export const calculateMomentum = (
  momentum: number,
  sessionCompleted: boolean,
  feedbackMultiplier: number = 1.0
): number => {
  const completionValue = sessionCompleted ? 1 : 0;

  const baseMomentum = CEWMA_ALPHA * completionValue + (1 - CEWMA_ALPHA) * momentum;
  const adjustedMomentum = baseMomentum * feedbackMultiplier;
  return Math.min(Math.max(adjustedMomentum, 0), 1);
};

export const momentumToMultiplier = (momentum: number): string => {
  return `${(momentum * 2).toFixed(2)}x`;
};

export const calculateFatigue = (
  totalTimer: number,
  totalTimerRemaining: number,
  lastFocusSessionDuration: number,
  lastFocusSessionCompleted: boolean
): number => {
  if (totalTimer === totalTimerRemaining) {
    return 0;
  }

  const overallDuration =
    Math.min((totalTimer - totalTimerRemaining) / MAX_FOCUS_SESSION_DURATION, 1) * 100;
  const progressFactor = ((totalTimer - totalTimerRemaining) / totalTimer) * 100;
  const incompletionPenalty = lastFocusSessionCompleted ? 0 : 100;
  const sessionEffortFactor =
    Math.min(lastFocusSessionDuration / MAX_FOCUS_SESSION_DURATION, 1) * 100;

  return Math.round(
    0.3 * overallDuration +
      0.25 * progressFactor +
      0.2 * incompletionPenalty +
      0.25 * sessionEffortFactor
  );
};

export const calculateFocusSessionDuration = (
  totalTimer: number,
  totalTimerRemaining: number,
  momentumScore: number,
  fatigueScore: number
): number => {
  if (totalTimerRemaining <= 0) {
    return 0;
  }

  // If we're in the final stretch, use exact remaining time. No rounding
  if (totalTimerRemaining <= totalTimer * FINAL_STRETCH_THRESHOLD) {
    return Math.floor(totalTimerRemaining);
  }

  const freshnessScore = 1 - fatigueScore / 100;
  const readiness = freshnessScore * 0.5 + momentumScore * 0.5; // Momenturm is 0 to 1,

  // Duration is always bounded between the MIN: 15 Min and MAX: 90 Min based on readiness
  const baseDuration =
    MIN_FOCUS_SESSION_DURATION +
    readiness * (MAX_FOCUS_SESSION_DURATION - MIN_FOCUS_SESSION_DURATION);

  const roundedDuration = Math.floor(baseDuration / 300) * 300;
  return Math.min(roundedDuration, totalTimerRemaining);
};

export const calculateBreakDuration = (fatigueScore: number, momentumScore: number): number => {
  const freshnessScore = 1 - fatigueScore / 100;
  const readiness = freshnessScore * 0.5 + momentumScore * 0.5;

  // Inverted: Low readiness (tired) = longer break, High readiness (fresh) = shorter break
  const baseDuration =
    MIN_BREAK_DURATION + (1 - readiness) * (MAX_BREAK_DURATION - MIN_BREAK_DURATION);

  const randomnessRange = (1 - readiness) * 300; // ±5 min when fully tired, ±0 when fresh
  const randomOffset = (Math.random() - 0.5) * randomnessRange * 2; // Random ±range

  const randomizedDuration = Math.max(
    MIN_BREAK_DURATION,
    Math.min(MAX_BREAK_DURATION, baseDuration + randomOffset)
  );

  const roundedDuration = Math.floor(randomizedDuration / 300) * 300;
  return roundedDuration;
};
