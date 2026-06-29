import { SESSION_STATES } from '@/Shared/Constants/Constants';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../Redux/store';

export const selectTimerState = (state: RootState) =>
  state.appState?.scheduler ?? {
    status: 'idle',
    phase: 'idle',
  };

export const selectSessionState = createSelector([selectTimerState], (scheduler) => {
  if (scheduler.status === 'running') {
    if (scheduler.phase === 'reward-game') return SESSION_STATES.REWARD_SELECTION;
    else if (scheduler.phase === 'return-countdown') return SESSION_STATES.FOCUS_SESSION_COUNTDOWN;
    return SESSION_STATES.ONGOING_FOCUS_SESSION;
  }
  if (scheduler.status === 'paused') {
    if (scheduler.phase === 'reward-game') return SESSION_STATES.REWARD_SELECTION;
    return SESSION_STATES.ONGOING_BREAK_SESSION;
  }
  return SESSION_STATES.BEFORE_WORK_SESSION;
});

export const selectIsPaused = createSelector(
  [selectTimerState],
  (scheduler) => scheduler.status === 'paused'
);

export const selectRerolls = () => 3;

export const selectGeneratedRewards = () => [];

export const selectShownRewardCombinations = () => [];

export const setInRewardSelection = createSelector(
  [selectSessionState],
  (sessionState) => sessionState === SESSION_STATES.REWARD_SELECTION
);

export const selectFatigueScore = () => 0;
export const selectMomentumScore = () => 1;
