import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startFocusSession,
  pauseSession,
  resumeSession,
  endSessionEarly,
  endWorkSessionEarly,
  selectReward,
  transitionToFocusSession,
  transitionToBeforeWorkSession,
  transitionToRewardSelection,
  transitionToFocusSessionCountdown,
  updateTimerState,
  setTotalTimer,
  updateWeightMultipliers,
  setGeneratedRewards,
  addShownRewardCombination,
  rerollReward as rerollRewardAction,
} from '../store/actions/timerActions';
import type { AppDispatch, RootState } from '../store';
import { Reward } from '../types/reward';
import { NOTIFY_TIME_LEFT_SECONDS } from '../constants/constants';
import { formatTime as formatTimeUtil, calculateRemaining } from '../services/timerService';
import {
  notifyFocusEnding,
  notifyFocusComplete,
  notifyBreakEnding,
  notifyBreakComplete,
} from '../services/notificationService';
import { generateRewards, generateReward } from '../services/rewardService';
import {
  selectTimerState,
  selectSessionState,
  selectIsPaused,
  selectGeneratedRewards,
  selectCanGenerateRewards,
  selectBlockedSites,
  selectShownRewardCombinations,
  selectRerolls,
} from '../store/selectors';

/**
 * Custom hook that provides timer functionality to components
 * Directly orchestrates Redux actions and selectors - no thunks
 */
export const useTimer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const timerState = useSelector((state: RootState) => selectTimerState(state));
  const sessionState = useSelector((state: RootState) => selectSessionState(state));
  const isPaused = useSelector((state: RootState) => selectIsPaused(state));
  const canGenerateRewards = useSelector((state: RootState) => selectCanGenerateRewards(state));
  const rewards = useSelector((state: RootState) => selectGeneratedRewards(state));
  const blockedSites = useSelector((state: RootState) => selectBlockedSites(state));
  const shownCombinations = useSelector((state: RootState) => selectShownRewardCombinations(state));
  const rerolls = useSelector((state: RootState) => selectRerolls(state));
  const [, setTick] = useState(0);

  const getActiveRemainingSeconds = useCallback((): number => {
    if (sessionState === 'ONGOING_FOCUS_SESSION') {
      if (isPaused || timerState.currentStartTime === undefined) {
        return timerState.currentTimerRemaining;
      }
      return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
    }

    if (sessionState === 'ONGOING_BREAK_SESSION') {
      if (timerState.currentStartTime === undefined) {
        return timerState.currentTimerRemaining;
      }
      return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
    }

    if (sessionState === 'FOCUS_SESSION_COUNTDOWN') {
      if (isPaused || timerState.currentStartTime === undefined)
        return timerState.currentTimerRemaining;
      return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
    }

    return timerState.currentTimerRemaining;
  }, [sessionState, isPaused, timerState.currentTimer, timerState.currentStartTime]);

  // Generate initial rewards when entering reward selection
  useEffect(() => {
    if (canGenerateRewards && blockedSites.length > 0) {
      const { rewards: newRewards, newCombinations } = generateRewards(
        blockedSites,
        3,
        shownCombinations
      );
      dispatch(setGeneratedRewards(newRewards));
      newCombinations.forEach((combination) => {
        dispatch(addShownRewardCombination(combination));
      });
    }
  }, [canGenerateRewards, blockedSites, shownCombinations, dispatch]);

  // Timer tick and notification effect
  useEffect(() => {
    const activeStates = [
      'ONGOING_FOCUS_SESSION',
      'ONGOING_BREAK_SESSION',
      'FOCUS_SESSION_COUNTDOWN',
    ];

    const notified = {
      focusEnding: false,
      focusEnd: false,
      breakEnding: false,
      breakEnd: false,
    };

    if (activeStates.includes(sessionState) && !isPaused) {
      const intervalId = setInterval(() => {
        const remaining = getActiveRemainingSeconds();

        if (sessionState === 'ONGOING_FOCUS_SESSION') {
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.focusEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            notifyFocusEnding(mins);
            notified.focusEnding = true;
          }
          if (remaining <= 0 && !notified.focusEnd) {
            notifyFocusComplete();
            notified.focusEnd = true;
            dispatch(transitionToRewardSelection());
            return;
          }
        }

        if (sessionState === 'ONGOING_BREAK_SESSION') {
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.breakEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            notifyBreakEnding(mins);
            notified.breakEnding = true;
          }
          if (remaining <= 0 && !notified.breakEnd) {
            notifyBreakComplete();
            notified.breakEnd = true;
            dispatch(transitionToFocusSessionCountdown());
            return;
          }
        }

        if (sessionState === 'FOCUS_SESSION_COUNTDOWN') {
          if (remaining <= 0) {
            dispatch(transitionToFocusSession());
            return;
          }
        }

        setTick((t) => t + 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [sessionState, isPaused, getActiveRemainingSeconds, dispatch]);

  const currentRemaining = getActiveRemainingSeconds();

  // Action wrappers
  const handleReroll = useCallback(
    (index: number) => {
      if (rerolls > 0 && blockedSites.length > 0) {
        const result = generateReward(blockedSites, shownCombinations);
        if (result) {
          dispatch(rerollRewardAction({ index, newReward: result.reward }));
          dispatch(addShownRewardCombination(result.combinationKey));
        }
      }
    },
    [rerolls, blockedSites, shownCombinations, dispatch]
  );

  return {
    timerState,
    currentRemaining,
    startFocusSession: () => dispatch(startFocusSession()),
    pauseSession: () => dispatch(pauseSession(currentRemaining)),
    resumeSession: () => dispatch(resumeSession()),
    endSessionEarly: () => dispatch(endSessionEarly()),
    endWorkSessionEarly: () => dispatch(endWorkSessionEarly()),
    transitionToBeforeWorkSession: () => dispatch(transitionToBeforeWorkSession()),
    selectReward: (reward: Reward) => dispatch(selectReward(reward)),
    handleReroll,
    updateTimerState: (updates: Partial<typeof timerState>) => dispatch(updateTimerState(updates)),
    setTotalTimer: (duration: number) => dispatch(setTotalTimer(duration)),
    updateWeightMultipliers: (multipliers: {
      fatigueMultiplier?: number;
      momentumMultiplier?: number;
    }) => dispatch(updateWeightMultipliers(multipliers)),
    rewards,
    formatTime: formatTimeUtil,
    isLoaded: true,
  };
};
