import {
  SLOTS_ANIMATION_DURATION_SECONDS,
  SLOTS_DECISION_WINDOW_SECONDS,
  SLOTS_REEL_STOP_INTERVAL_SECONDS,
} from '@/constants/constants';

export const getSlotsDecisionWindowMs = (): number => SLOTS_DECISION_WINDOW_SECONDS * 1000;

export const getSlotsReelSpinDurationSeconds = (reelIndex: number, reelCount: number): number => {
  const baseDuration =
    SLOTS_ANIMATION_DURATION_SECONDS - (reelCount - 1) * SLOTS_REEL_STOP_INTERVAL_SECONDS;

  return baseDuration + reelIndex * SLOTS_REEL_STOP_INTERVAL_SECONDS;
};

export const getSlotsAnimationDurationMs = (reelCount: number): number =>
  getSlotsReelSpinDurationSeconds(Math.max(reelCount - 1, 0), reelCount) * 1000;

/** Wall-clock delay before a spin result settles; unchanged by reduced-motion presentation. */
export const getSlotsSettlementDelayMs = (reelCount: number): number =>
  getSlotsAnimationDurationMs(reelCount);
