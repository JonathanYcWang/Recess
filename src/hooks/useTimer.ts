import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  startFocusSession,
  pauseSession,
  resumeSession,
  endSessionEarly,
  selectReward,
  transitionToFocusSession,
  transitionToRewardSelection,
  transitionToFocusSessionCountdown,
  resetTimer,
  updateTimerState,
  setWorkSessionDuration,
  updateWeightMultipliers,
  completeWorkSessionEarly,
  setGeneratedRewards,
  addShownRewardCombination,
  rerollReward as rerollRewardAction,
} from '../store/actions/timerActions';
import type { AppDispatch, RootState } from '../store';
import { Reward } from '../types/reward';
import { NOTIFY_TIME_LEFT_SECONDS } from '../constants/constants';
import { formatTime as formatTimeUtil, calculateRemaining } from '../services/timerService';
import { notifyFocusEnding, notifyFocusComplete, notifyBreakEnding, notifyBreakComplete } from '../services/notificationService';
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
        let shouldTransition = false;

        if (sessionState === 'ONGOING_FOCUS_SESSION') {
          const remaining = calculateRemaining(
            timerState.initialFocusSessionDuration,
            timerState.focusSessionEntryTimeStamp
          );
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.focusEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            notifyFocusEnding(mins);
            notified.focusEnding = true;
          }
          if (remaining <= 0 && !notified.focusEnd) {
            notifyFocusComplete();
            notified.focusEnd = true;
            shouldTransition = true;
            dispatch(transitionToRewardSelection());
          }
        } else if (sessionState === 'ONGOING_BREAK_SESSION') {
          const remaining = calculateRemaining(
            timerState.initialBreakSessionDuration,
            timerState.breakSessionEntryTimeStamp
          );
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.breakEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            notifyBreakEnding(mins);
            notified.breakEnding = true;
          }
          if (remaining <= 0 && !notified.breakEnd) {
            notifyBreakComplete();
            notified.breakEnd = true;
            shouldTransition = true;
            dispatch(transitionToFocusSessionCountdown());
          }
        } else if (sessionState === 'FOCUS_SESSION_COUNTDOWN') {
          const remaining = calculateRemaining(
            timerState.initialFocusSessionCountdownDuration,
            timerState.focusSessionCountdownEntryTimeStamp
          );
          if (remaining <= 0) {
            shouldTransition = true;
            dispatch(transitionToFocusSession());
          }
        }

        if (!shouldTransition) {
          setTick((t) => t + 1);
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [
    sessionState,
    isPaused,
    timerState.initialFocusSessionDuration,
    timerState.focusSessionEntryTimeStamp,
    timerState.initialBreakSessionDuration,
    timerState.breakSessionEntryTimeStamp,
    timerState.initialFocusSessionCountdownDuration,
    timerState.focusSessionCountdownEntryTimeStamp,
    dispatch,
  ]);

  // Derived state for UI (with live countdown calculations)
  const getDerivedTimerState = useCallback(() => {
    let derived = { ...timerState };

    if (sessionState === 'ONGOING_FOCUS_SESSION' && !isPaused) {
      derived.focusSessionDurationRemaining = calculateRemaining(
        timerState.initialFocusSessionDuration,
        timerState.focusSessionEntryTimeStamp
      );
    } else if (sessionState === 'ONGOING_BREAK_SESSION') {
      derived.breakSessionDurationRemaining = calculateRemaining(
        timerState.initialBreakSessionDuration,
        timerState.breakSessionEntryTimeStamp
      );
    } else if (sessionState === 'FOCUS_SESSION_COUNTDOWN' && !isPaused) {
      derived.focusSessionCountdownTimeRemaining = calculateRemaining(
        timerState.initialFocusSessionCountdownDuration,
        timerState.focusSessionCountdownEntryTimeStamp
      );
    }

    return derived;
  }, [timerState, sessionState, isPaused]);

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
    timerState: getDerivedTimerState(),
    startFocusSession: () => dispatch(startFocusSession()),
    pauseSession: () => dispatch(pauseSession()),
    resumeSession: () => dispatch(resumeSession()),
    endSessionEarly: () => dispatch(endSessionEarly()),
    selectReward: (reward: Reward) => dispatch(selectReward(reward)),
    handleReroll,
    resetTimerState: () => dispatch(resetTimer()),
    updateTimerState: (updates: Partial<typeof timerState>) =>
      dispatch(updateTimerState(updates)),
    setWorkSessionDuration: (durationInMinutes: number) =>
      dispatch(setWorkSessionDuration(durationInMinutes)),
    updateWeightMultipliers: (multipliers: {
      fatigueMultiplier?: number;
      momentumMultiplier?: number;
    }) => dispatch(updateWeightMultipliers(multipliers)),
    completeWorkSessionEarly: () => dispatch(completeWorkSessionEarly()),
    rewards,
    formatTime: formatTimeUtil,
    isLoaded: true,
  };
};
