import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  startFocusSession,
  pauseSession,
  resumeSession,
  endSessionEarly,
  selectReward,
  setGeneratedRewards,
  rerollReward,
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
import {
  REWARD_TIME_INTERVAL,
  MAX_REWARD_TIME,
  NOTIFY_TIME_LEFT_SECONDS,
} from '../../lib/constants';
import { formatTime as formatTimeUtil, calculateRemaining } from '../../lib/timer-utils';

import { selectTimerState } from '../selectors/timerSelectors';

export const useTimer = () => {
  const sendNotification = (title: string, message: string) => {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SESSION_NOTIFICATION', title, message });
    }
  };
  const dispatch = useAppDispatch();
  const timerState = useAppSelector(selectTimerState);
  const blockedSites = useAppSelector((state) => state.blockedSites.sites);
  const [, setTick] = useState(0); // Force re-render for UI updates

  const generateReward = useCallback((availableSites: string[]): Reward | null => {
    if (availableSites.length === 0) return null;

    const randomSite = availableSites[Math.floor(Math.random() * availableSites.length)];
    const numIntervals = Math.floor(MAX_REWARD_TIME / REWARD_TIME_INTERVAL);
    const minutes = Math.floor(Math.random() * numIntervals + 1) * REWARD_TIME_INTERVAL;

    return {
      id: `${randomSite}-${Date.now()}-${Math.random()}`,
      name: randomSite,
      duration: `${minutes} min`,
      durationSeconds: minutes * 60,
    };
  }, []);

  useEffect(() => {
    if (
      timerState.sessionState === 'REWARD_SELECTION' &&
      blockedSites.length > 0 &&
      timerState.generatedRewards.length === 0
    ) {
      const newRewards: Reward[] = [];
      for (let i = 0; i < 3; i++) {
        const reward = generateReward(blockedSites);
        if (reward) newRewards.push(reward);
      }
      dispatch(setGeneratedRewards(newRewards));
    }
  }, [
    timerState.sessionState,
    blockedSites,
    timerState.generatedRewards.length,
    generateReward,
    dispatch,
  ]);

  useEffect(() => {
    const activeStates = [
      'ONGOING_FOCUS_SESSION',
      'ONGOING_BREAK_SESSION',
      'FOCUS_SESSION_COUNTDOWN',
    ];

    const notified = { focusEnding: false, focusEnd: false, breakEnding: false, breakEnd: false };

    if (activeStates.includes(timerState.sessionState) && !timerState.isPaused) {
      const intervalId = setInterval(() => {
        let shouldTransition = false;

        if (timerState.sessionState === 'ONGOING_FOCUS_SESSION') {
          const remaining = calculateRemaining(
            timerState.initialFocusSessionDuration,
            timerState.focusSessionEntryTimeStamp
          );
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.focusEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            sendNotification('Focus Ending Soon', `${mins} minutes left in your focus session!`);
            notified.focusEnding = true;
          }
          if (remaining <= 0 && !notified.focusEnd) {
            sendNotification('Focus Complete', 'Your focus session has ended!');
            notified.focusEnd = true;
            shouldTransition = true;
            dispatch(transitionToRewardSelection());
          }
        } else if (timerState.sessionState === 'ONGOING_BREAK_SESSION') {
          const remaining = calculateRemaining(
            timerState.initialBreakSessionDuration,
            timerState.breakSessionEntryTimeStamp
          );
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.breakEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            sendNotification('Break Ending Soon', `${mins} minutes left in your break!`);
            notified.breakEnding = true;
          }
          if (remaining <= 0 && !notified.breakEnd) {
            sendNotification('Break Complete', 'Your break has ended!');
            notified.breakEnd = true;
            shouldTransition = true;
            dispatch(transitionToFocusSessionCountdown());
          }
        } else if (timerState.sessionState === 'FOCUS_SESSION_COUNTDOWN') {
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
    timerState.sessionState,
    timerState.isPaused,
    timerState.initialFocusSessionDuration,
    timerState.focusSessionEntryTimeStamp,
    timerState.initialBreakSessionDuration,
    timerState.breakSessionEntryTimeStamp,
    timerState.initialFocusSessionCountdownDuration,
    timerState.focusSessionCountdownEntryTimeStamp,
    dispatch,
  ]);

  // Derived state for UI
  const getDerivedTimerState = useCallback(() => {
    let derived = { ...timerState };

    if (timerState.sessionState === 'ONGOING_FOCUS_SESSION' && !timerState.isPaused) {
      derived.focusSessionDurationRemaining = calculateRemaining(
        timerState.initialFocusSessionDuration,
        timerState.focusSessionEntryTimeStamp
      );
    } else if (timerState.sessionState === 'ONGOING_BREAK_SESSION') {
      derived.breakSessionDurationRemaining = calculateRemaining(
        timerState.initialBreakSessionDuration,
        timerState.breakSessionEntryTimeStamp
      );
    } else if (timerState.sessionState === 'FOCUS_SESSION_COUNTDOWN' && !timerState.isPaused) {
      derived.focusSessionCountdownTimeRemaining = calculateRemaining(
        timerState.initialFocusSessionCountdownDuration,
        timerState.focusSessionCountdownEntryTimeStamp
      );
    }

    return derived;
  }, [timerState]);

  // Action wrappers
  const handleStartFocusSession = useCallback(() => {
    dispatch(startFocusSession());
  }, [dispatch]);

  const handlePauseSession = useCallback(() => {
    dispatch(pauseSession());
  }, [dispatch]);

  const handleResumeSession = useCallback(() => {
    dispatch(resumeSession());
  }, [dispatch]);

  const handleEndSessionEarly = useCallback(() => {
    dispatch(endSessionEarly());
  }, [dispatch]);

  const handleSelectReward = useCallback(
    (reward: Reward) => {
      dispatch(selectReward(reward));
    },
    [dispatch]
  );

  const handleReroll = useCallback(
    (index: number) => {
      if (timerState.rerolls > 0) {
        const newReward = generateReward(blockedSites);
        if (newReward) {
          dispatch(rerollReward({ index, newReward }));
        }
      }
    },
    [timerState.rerolls, blockedSites, generateReward, dispatch]
  );

  const handleResetTimer = useCallback(() => {
    dispatch(resetTimer());
  }, [dispatch]);

  const handleUpdateTimerState = useCallback(
    (updates: Partial<typeof timerState>) => {
      dispatch(updateTimerState(updates));
    },
    [dispatch]
  );

  const handleSetWorkSessionDuration = useCallback(
    (durationInMinutes: number) => {
      dispatch(setWorkSessionDuration(durationInMinutes));
    },
    [dispatch]
  );

  const handleUpdateWeightMultipliers = useCallback(
    (multipliers: { fatigueMultiplier?: number; momentumMultiplier?: number }) => {
      dispatch(updateWeightMultipliers(multipliers));
    },
    [dispatch]
  );

  const handleCompleteWorkSessionEarly = useCallback(() => {
    dispatch(completeWorkSessionEarly());
  }, [dispatch]);

  const formatTime = useCallback((seconds: number): string => {
    return formatTimeUtil(seconds);
  }, []);

  return {
    timerState: getDerivedTimerState(),
    startFocusSession: handleStartFocusSession,
    pauseSession: handlePauseSession,
    resumeSession: handleResumeSession,
    endSessionEarly: handleEndSessionEarly,
    selectReward: handleSelectReward,
    handleReroll,
    resetTimerState: handleResetTimer,
    updateTimerState: handleUpdateTimerState,
    setWorkSessionDuration: handleSetWorkSessionDuration,
    updateWeightMultipliers: handleUpdateWeightMultipliers,
    completeWorkSessionEarly: handleCompleteWorkSessionEarly,
    rewards: timerState.generatedRewards,
    formatTime,
    isLoaded: true,
  };
};
