import { createAction } from '@reduxjs/toolkit';
import { TimerState } from '../../types/timer';
import { Reward } from '../../types/reward';

export const updateTimerState = createAction<Partial<TimerState>>('timer/updateTimerState');
export const resetTimer = createAction('timer/resetTimer');
export const setWorkSessionDuration = createAction<number>('timer/setWorkSessionDuration');
export const startFocusSession = createAction('timer/startFocusSession');
export const pauseSession = createAction('timer/pauseSession');
export const resumeSession = createAction('timer/resumeSession');
export const endSessionEarly = createAction('timer/endSessionEarly');
export const selectReward = createAction<Reward>('timer/selectReward');
export const setGeneratedRewards = createAction<Reward[]>('timer/setGeneratedRewards');
export const addShownRewardCombination = createAction<string>('timer/addShownRewardCombination');
export const rerollReward = createAction<{ index: number; newReward: Reward }>('timer/rerollReward');
export const transitionToFocusSession = createAction('timer/transitionToFocusSession');
export const transitionToRewardSelection = createAction('timer/transitionToRewardSelection');
export const transitionToFocusSessionCountdown = createAction('timer/transitionToFocusSessionCountdown');
export const updateWeightMultipliers = createAction<{
  fatigueMultiplier?: number;
  momentumMultiplier?: number;
}>('timer/updateWeightMultipliers');
export const completeWorkSessionEarly = createAction('timer/completeWorkSessionEarly');
