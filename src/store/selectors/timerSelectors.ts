import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector - use this when you need the entire timer state
export const selectTimerState = (state: RootState) => state.timer;

// Core state selectors
export const selectSessionState = createSelector([selectTimerState], (timer) => timer.sessionState);

export const selectIsPaused = createSelector([selectTimerState], (timer) => timer.isPaused);

export const selectRerolls = createSelector([selectTimerState], (timer) => timer.rerolls);

// (selectSelectedReward removed — unused)

export const selectGeneratedRewards = createSelector(
  [selectTimerState],
  (timer) => timer.generatedRewards
);

export const selectShownRewardCombinations = createSelector(
  [selectTimerState],
  (timer) => timer.shownRewardCombinations
);

// Work session selectors
// Work session selectors removed (unused)

// Current stage (focus/break/countdown) timer selectors

// Several derived selectors removed (unused)

export const selectCanGenerateRewards = createSelector(
  [selectSessionState, selectGeneratedRewards],
  (sessionState, generatedRewards) => sessionState === 'REWARD_SELECTION' && generatedRewards.length === 0
);
// (selectWorkProgress removed)
