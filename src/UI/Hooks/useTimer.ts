import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { sendAppAction } from '../../Shared/ActionBrokers/ActionBroker';
import type { RootState } from '../Redux/store';
import { Reward } from '../../Shared/Types/Reward';
import { NOTIFY_TIME_LEFT_SECONDS } from '../../Shared/Constants/Constants';
import {
  notifyFocusEnding,
  notifyFocusComplete,
  notifyBreakEnding,
  notifyBreakComplete,
} from '../../Background/Adapters/Notification/NotificationAdapter';
import { generateReward } from '../../Shared/Utils/RewardService';
import {
  selectBlockedSites,
  selectFatigueScore,
  selectGeneratedRewards,
  selectIsPaused,
  selectMomentumScore,
  selectRerolls,
  selectSessionState,
  selectShownRewardCombinations,
  selectTimerState,
} from '../Redux/Selectors/index';
import { SESSION_STATES } from '../../Shared/Constants/Constants';

const ACTIVE_SESSION_STATES = [
  SESSION_STATES.ONGOING_FOCUS_SESSION,
  SESSION_STATES.ONGOING_BREAK_SESSION,
  SESSION_STATES.FOCUS_SESSION_COUNTDOWN,
] as const;
const COMPLETE_TIMER_DISPLAY_DELAY_MS = 1000;

/**
 * Custom hook that provides timer functionality to components.
 * Sends domain actions through ActionBroker; reads state from Redux selectors.
 */
export const useTimer = () => {
  const timerState = useSelector((state: RootState) => selectTimerState(state));
  const sessionState = useSelector((state: RootState) => selectSessionState(state));
  const isPaused = useSelector((state: RootState) => selectIsPaused(state));
  const rewards = useSelector((state: RootState) => selectGeneratedRewards(state));
  const blockedSites = useSelector((state: RootState) => selectBlockedSites(state));
  const shownCombinations = useSelector((state: RootState) => selectShownRewardCombinations(state));
  const rerolls = useSelector((state: RootState) => selectRerolls(state));
  const fatigueScore = useSelector((state: RootState) => selectFatigueScore(state));
  const momentumScore = useSelector((state: RootState) => selectMomentumScore(state));
  const [, setTick] = useState(0);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCompletionSessionRef = useRef<string | null>(null);

  const clearPendingCompletion = useCallback(() => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    pendingCompletionSessionRef.current = null;
  }, []);

  const handleExpiredSession = useCallback(
    (remaining: number) => {
      if (remaining > 0 || isPaused) {
        return;
      }

      if (pendingCompletionSessionRef.current === sessionState) {
        return;
      }

      pendingCompletionSessionRef.current = sessionState;
      setTick((t) => t + 1);

      if (sessionState === SESSION_STATES.ONGOING_FOCUS_SESSION) {
        notifyFocusComplete();
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          void sendAppAction({ type: 'TIMER_TRANSITION_TO_REWARD_SELECTION' });
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
        return;
      }

      if (sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
        notifyBreakComplete();
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          void sendAppAction({ type: 'TIMER_TRANSITION_TO_FOCUS_SESSION_COUNTDOWN' });
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
        return;
      }

      if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          void sendAppAction({ type: 'TIMER_TRANSITION_TO_FOCUS_SESSION' });
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
      }
    },
    [isPaused, sessionState]
  );

  // TO DO FOllOW
  // const getActiveRemainingSeconds = useCallback((): number => {
  //   if (sessionState === SESSION_STATES.ONGOING_FOCUS_SESSION) {
  //     if (isPaused || timerState.currentStartTime === undefined) {
  //       return timerState.currentTimerRemaining;
  //     }
  //     return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
  //   }

  //   if (sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
  //       return timerState?.currentTimerRemaining;
  //     }
  //     return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
  //   }

  //   if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
  //     if (isPaused || timerState.currentStartTime === undefined)
  //       return timerState.currentTimerRemaining;
  //     return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
  //   }

  //   return timerState.currentTimerRemaining;
  // }, [sessionState, isPaused, timerState.currentTimerRemaining, timerState.currentStartTime]);

  // const currentRemaining = getActiveRemainingSeconds();

  const getActiveRemainingSeconds = useCallback(() => 5 * 60, []);
  const currentRemaining = getActiveRemainingSeconds();

  useEffect(() => {
    if (
      sessionState === SESSION_STATES.REWARD_SELECTION &&
      blockedSites.length > 0 &&
      rewards.length === 0
    ) {
      const seenRewardCombinations = [...shownCombinations];
      const newRewards = Array.from({ length: 3 }, () =>
        generateReward(blockedSites, seenRewardCombinations, fatigueScore, momentumScore)
      );
      void sendAppAction({ type: 'TIMER_SET_GENERATED_REWARDS', rewards: newRewards });
      void sendAppAction({
        type: 'TIMER_SET_SHOWN_REWARD_COMBINATIONS',
        combinations: seenRewardCombinations,
      });
    }
  }, [sessionState, rewards.length, blockedSites, shownCombinations, fatigueScore, momentumScore]);

  // Timer tick and notification effect
  useEffect(() => {
    const notified = {
      focusEnding: false,
      focusEnd: false,
      breakEnding: false,
      breakEnd: false,
    };

    if (
      ACTIVE_SESSION_STATES.includes(sessionState as (typeof ACTIVE_SESSION_STATES)[number]) &&
      !isPaused
    ) {
      const intervalId = setInterval(() => {
        const remaining = getActiveRemainingSeconds();

        if (sessionState === SESSION_STATES.ONGOING_FOCUS_SESSION) {
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.focusEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            notifyFocusEnding(mins);
            notified.focusEnding = true;
          }
          if (remaining <= 0 && !notified.focusEnd) {
            notified.focusEnd = true;
            handleExpiredSession(remaining);
            return;
          }
        }

        if (sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
          if (remaining <= NOTIFY_TIME_LEFT_SECONDS && remaining > 0 && !notified.breakEnding) {
            const mins = Math.ceil(NOTIFY_TIME_LEFT_SECONDS / 60);
            notifyBreakEnding(mins);
            notified.breakEnding = true;
          }
          if (remaining <= 0 && !notified.breakEnd) {
            notified.breakEnd = true;
            handleExpiredSession(remaining);
            return;
          }
        }

        if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
          if (remaining <= 0) {
            handleExpiredSession(remaining);
            return;
          }
        }

        setTick((t) => t + 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [sessionState, isPaused, getActiveRemainingSeconds, handleExpiredSession]);

  useEffect(() => {
    handleExpiredSession(currentRemaining);
  }, [currentRemaining, handleExpiredSession]);

  useEffect(() => {
    if (currentRemaining > 0 || isPaused) {
      clearPendingCompletion();
    }
  }, [clearPendingCompletion, currentRemaining, isPaused]);

  useEffect(() => clearPendingCompletion, [clearPendingCompletion]);

  const handleReroll = useCallback(
    (index: number) => {
      if (rerolls > 0 && blockedSites.length > 0) {
        const seenRewardCombinations = [...shownCombinations];
        const reward = generateReward(
          blockedSites,
          seenRewardCombinations,
          fatigueScore,
          momentumScore
        );
        void sendAppAction({ type: 'TIMER_REROLL_REWARD', index, reward });
        void sendAppAction({
          type: 'TIMER_SET_SHOWN_REWARD_COMBINATIONS',
          combinations: seenRewardCombinations,
        });
      }
    },
    [rerolls, blockedSites, shownCombinations, fatigueScore, momentumScore]
  );

  return {
    timerState,
    currentTimer: currentRemaining,
    currentRemaining,
    totalRemaining: currentRemaining,
    startFocusSession: () => sendAppAction({ type: 'TIMER_START_FOCUS_SESSION' }),
    pauseSession: () => sendAppAction({ type: 'TIMER_PAUSE_SESSION', remaining: currentRemaining }),
    resumeSession: () => sendAppAction({ type: 'TIMER_RESUME_SESSION' }),
    endSessionEarly: () => sendAppAction({ type: 'TIMER_END_SESSION_EARLY' }),
    endWorkSessionEarly: () => sendAppAction({ type: 'TIMER_END_WORK_SESSION_EARLY' }),
    transitionToBeforeWorkSession: () =>
      sendAppAction({ type: 'TIMER_TRANSITION_TO_BEFORE_WORK_SESSION' }),
    selectReward: (reward: Reward) => sendAppAction({ type: 'TIMER_SELECT_REWARD', reward }),
    handleReroll,
    setTotalTimer: (duration: number) => sendAppAction({ type: 'TIMER_SET_TOTAL_TIMER', duration }),
    updateFeedbackMultiplier: (multiplier: number) =>
      sendAppAction({ type: 'TIMER_UPDATE_FEEDBACK_MULTIPLIER', multiplier }),
    rewards,
    sessionState,
    isPaused,
    rerolls,
    selectedReward: {
      id: '123',
      name: 'youtube.com',
      duration: 15,
    },
  };
};
