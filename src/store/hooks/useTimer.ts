import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
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
} from '../slices/timerSlice';
import { Reward } from '../../lib/types';
import { NOTIFY_TIME_LEFT_SECONDS } from '../../lib/constants';
import { formatTime as formatTimeUtil, calculateRemaining } from '../../lib/timer-utils';
import { NotificationService } from '../services/notificationService';
import { generateInitialRewards, rerollReward as rerollRewardThunk } from '../thunks/timerThunks';
import {
  selectTimerState,
  selectSessionState,
  selectIsPaused,
  selectGeneratedRewards,
  selectCanGenerateRewards,
} from '../selectors/timerSelectors';

/**
 * Custom hook that provides timer functionality to components
 * This is a thin wrapper around Redux actions and selectors
 */
export const useTimer = () => {
  const dispatch = useAppDispatch();
  const timerState = useAppSelector(selectTimerState);
  const sessionState = useAppSelector(selectSessionState);
  const isPaused = useAppSelector(selectIsPaused);
  const canGenerateRewards = useAppSelector(selectCanGenerateRewards);
  const rewards = useAppSelector(selectGeneratedRewards);
  const [, setTick] = useState(0);

  // Generate initial rewards when entering reward selection
  useEffect(() => {
    if (canGenerateRewards) {
      dispatch(generateInitialRewards());
    }
  }, [canGenerateRewards, dispatch]);

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
            NotificationService.notifyFocusEnding(mins);
            notified.focusEnding = true;
          }
          if (remaining <= 0 && !notified.focusEnd) {
            NotificationService.notifyFocusComplete();
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
            NotificationService.notifyBreakEnding(mins);
            notified.breakEnding = true;
          }
          if (remaining <= 0 && !notified.breakEnd) {
            NotificationService.notifyBreakComplete();
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
      dispatch(rerollRewardThunk(index));
    },
    [dispatch]
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
