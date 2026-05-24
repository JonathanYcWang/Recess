import { SESSION_STATES } from '../../constants/constants';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export const selectTimerState = (state: RootState) => state.timer;

export const selectSessionState = createSelector([selectTimerState], (timer) => timer.sessionState);

export const selectIsPaused = createSelector([selectTimerState], (timer) => timer.isPaused);

export const selectRerolls = createSelector([selectTimerState], (timer) => timer.rerolls);

export const selectGeneratedRewards = createSelector(
  [selectTimerState],
  (timer) => timer.generatedRewards
);

export const selectShownRewardCombinations = createSelector(
  [selectTimerState],
  (timer) => timer.shownRewardCombinations
);

export const setInRewardSelection = createSelector(
  [selectSessionState],
  (sessionState) => sessionState === SESSION_STATES.REWARD_SELECTION
);

export const selectFatigueScore = createSelector([selectTimerState], (timer) => timer.fatigueScore);
export const selectMomentumScore = createSelector(
  [selectTimerState],
  (timer) => timer.momentumScore
);
