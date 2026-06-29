import { useCallback, useEffect, useRef, useState } from 'react';
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
  setTotalTimer,
  updateFeedbackMultiplier,
  setGeneratedRewards,
  setShownRewardCombinations,
  rerollReward as rerollRewardAction,
} from '../store/actions/timerActions';
import type { AppDispatch, RootState } from '../store';
import { Reward } from '../types/reward';
import { NOTIFY_TIME_LEFT_SECONDS } from '../constants/constants';
// import { calculateRemaining } from '../services/timerService';
import {
  notifyFocusEnding,
  notifyFocusComplete,
  notifyBreakEnding,
  notifyBreakComplete,
} from '../services/notificationService';
import { generateReward } from '../services/rewardService';
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
} from '../store/selectors';
import { SESSION_STATES } from '../constants/constants';

const ACTIVE_SESSION_STATES = [
  SESSION_STATES.ONGOING_FOCUS_SESSION,
  SESSION_STATES.ONGOING_BREAK_SESSION,
  SESSION_STATES.FOCUS_SESSION_COUNTDOWN,
] as const;
const COMPLETE_TIMER_DISPLAY_DELAY_MS = 1000;

/**
 * Custom hook that provides timer functionality to components
 * Directly orchestrates Redux actions and selectors - no thunks
 */
export const useTimer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const timerState = useSelector((state: RootState) => selectTimerState(state));
  const sessionState = useSelector((state: RootState) => selectSessionState(state));
  const isPaused = useSelector((state: RootState) => selectIsPaused(state));
  const rewards = useSelector(() => selectGeneratedRewards());
  const blockedSites = useSelector((state: RootState) => selectBlockedSites(state));
  const shownCombinations = useSelector(() => selectShownRewardCombinations());
  const rerolls = useSelector(() => selectRerolls());
  const fatigueScore = useSelector(() => selectFatigueScore());
  const momentumScore = useSelector(() => selectMomentumScore());
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
          dispatch(transitionToRewardSelection());
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
        return;
      }

      if (sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
        notifyBreakComplete();
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          dispatch(transitionToFocusSessionCountdown());
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
        return;
      }

      if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          dispatch(transitionToFocusSession());
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
      }
    },
    [dispatch, isPaused, sessionState]
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

  const getActiveRemainingSeconds = () => 5 * 60;
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
      dispatch(setGeneratedRewards(newRewards));
      dispatch(setShownRewardCombinations(seenRewardCombinations));
    }
    // Reward generation is intentionally tied to session entry, not every score change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- blockedSites and scores are read at entry only.
  }, [sessionState, dispatch, rewards.length]);

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
  }, [sessionState, isPaused, getActiveRemainingSeconds, handleExpiredSession, dispatch]);

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
        dispatch(rerollRewardAction({ index, reward }));
        dispatch(setShownRewardCombinations(seenRewardCombinations));
      }
    },
    [rerolls, blockedSites, shownCombinations, dispatch, fatigueScore, momentumScore]
  );

  return {
    timerState,
    // currentTimer: timerState.currentTimer,
    currentTimer: currentRemaining,
    currentRemaining,
    // totalRemaining: timerState.totalRemaining,
    totalRemaining: currentRemaining,
    startFocusSession: () => dispatch(startFocusSession()),
    pauseSession: () => dispatch(pauseSession(currentRemaining)),
    resumeSession: () => dispatch(resumeSession()),
    endSessionEarly: () => dispatch(endSessionEarly()),
    endWorkSessionEarly: () => dispatch(endWorkSessionEarly()),
    transitionToBeforeWorkSession: () => dispatch(transitionToBeforeWorkSession()),
    selectReward: (reward: Reward) => dispatch(selectReward(reward)),
    handleReroll,
    setTotalTimer: (duration: number) => dispatch(setTotalTimer(duration)),
    updateFeedbackMultiplier: (feedbackMultiplier: number) =>
      dispatch(updateFeedbackMultiplier(feedbackMultiplier)),
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
