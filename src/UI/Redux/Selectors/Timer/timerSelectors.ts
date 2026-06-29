import type { TimerValue } from '@/Shared/Types/AppState';
import type { RootState } from '../../../Redux/store';

export const selectTimerState = (state: RootState): TimerValue =>
  state.appState?.timer ?? {
    sessionState: 'before-work-session',
    isPaused: false,
    totalTimer: 0,
    totalRemaining: 0,
    currentTimer: 0,
    currentTimerRemaining: 0,
    currentStartTime: undefined,
    rerolls: 3,
    selectedReward: null,
    shownRewardCombinations: [],
    generatedRewards: [],
    lastFocusSessionCompleted: false,
    momentumScore: 1,
    fatigueScore: 0,
    lastFocusSessionDuration: 0,
    feedbackMultiplier: 1.0,
  };

export const selectSessionState = (state: RootState): string =>
  selectTimerState(state).sessionState;

export const selectIsPaused = (state: RootState): boolean => selectTimerState(state).isPaused;

export const selectRerolls = (state: RootState): number => selectTimerState(state).rerolls;

export const selectGeneratedRewards = (state: RootState): TimerValue['generatedRewards'] =>
  selectTimerState(state).generatedRewards;

export const selectShownRewardCombinations = (state: RootState): string[] =>
  selectTimerState(state).shownRewardCombinations;

export const selectFatigueScore = (state: RootState): number =>
  selectTimerState(state).fatigueScore;

export const selectMomentumScore = (state: RootState): number =>
  selectTimerState(state).momentumScore;
