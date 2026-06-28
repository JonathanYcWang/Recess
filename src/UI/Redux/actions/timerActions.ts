import { createAction } from '@reduxjs/toolkit';
import { TimerState } from '@/types/timer';
import { Reward } from '@/types/reward';

export const updateTimerState = createAction<Partial<TimerState>>('timer/updateTimerState');
export const setTotalTimer = createAction<number>('timer/setTotalTimer');
export const startFocusSession = createAction('timer/startFocusSession');
export const pauseSession = createAction<number>('timer/pauseSession');
export const resumeSession = createAction('timer/resumeSession');
export const endSessionEarly = createAction('timer/endSessionEarly');
export const endWorkSessionEarly = createAction('timer/endWorkSessionEarly');
export const selectReward = createAction<Reward>('timer/selectReward');
export const setGeneratedRewards = createAction<Reward[]>('timer/setGeneratedRewards');
export const setShownRewardCombinations = createAction<string[]>(
  'timer/setShownRewardCombinations'
);

export const rerollReward = createAction<{ index: number; reward: Reward }>('timer/rerollReward');
export const transitionToFocusSession = createAction('timer/transitionToFocusSession');
export const transitionToRewardSelection = createAction('timer/transitionToRewardSelection');
export const transitionToBeforeWorkSession = createAction('timer/transitionToBeforeWorkSession');
export const transitionToFocusSessionCountdown = createAction(
  'timer/transitionToFocusSessionCountdown'
);
export const updateFeedbackMultiplier = createAction<number>('timer/updateFeedbackMultiplier');
