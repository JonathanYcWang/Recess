import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createActionBroker } from '@/store/actionBroker';
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
  updateFeedbackMultiplier,
  setGeneratedRewards,
  setShownRewardCombinations,
  rerollReward as rerollRewardAction,
} from '../store/actions/timerActions';
import type { AppDispatch, RootState } from '../store';
import { Reward } from '../types/reward';
import { NOTIFY_TIME_LEFT_SECONDS } from '../constants/constants';
import { calculateRemaining } from '../services/timerService';
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
  const actionBroker = createActionBroker(dispatch);
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
          actionBroker.route(transitionToRewardSelection());
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
        return;
      }

      if (sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
        notifyBreakComplete();
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          actionBroker.route(transitionToFocusSessionCountdown());
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
        return;
      }

      if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          actionBroker.route(transitionToFocusSession());
        }, COMPLETE_TIMER_DISPLAY_DELAY_MS);
      }
    },
    [dispatch, isPaused, sessionState]
  );

  const getActiveRemainingSeconds = useCallback((): number => {
    if (sessionState === SESSION_STATES.ONGOING_FOCUS_SESSION) {
      if (isPaused || timerState.currentStartTime === undefined) {
        return timerState.currentTimerRemaining;
      }
      return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
    }

    if (sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
      if (timerState.currentStartTime === undefined) {
        return timerState.currentTimerRemaining;
      }
      return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
    }

    if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
      if (isPaused || timerState.currentStartTime === undefined)
        return timerState.currentTimerRemaining;
      return calculateRemaining(timerState.currentTimerRemaining, timerState.currentStartTime);
    }

    return timerState.currentTimerRemaining;
  }, [sessionState, isPaused, timerState.currentTimerRemaining, timerState.currentStartTime]);

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
      actionBroker.route(setGeneratedRewards(newRewards));
      actionBroker.route(setShownRewardCombinations(seenRewardCombinations));
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
        actionBroker.route(rerollRewardAction({ index, reward }));
        actionBroker.route(setShownRewardCombinations(seenRewardCombinations));
      }
    },
    [rerolls, blockedSites, shownCombinations, dispatch, fatigueScore, momentumScore]
  );

  return {
    timerState,
    currentTimer: timerState.currentTimer,
    currentRemaining,
    totalRemaining: timerState.totalRemaining,
    startFocusSession: () => actionBroker.route(startFocusSession()),
    pauseSession: () => actionBroker.route(pauseSession(currentRemaining)),
    resumeSession: () => actionBroker.route(resumeSession()),
    endSessionEarly: () => actionBroker.route(endSessionEarly()),
    endWorkSessionEarly: () => actionBroker.route(endWorkSessionEarly()),
    transitionToBeforeWorkSession: () => actionBroker.route(transitionToBeforeWorkSession()),
    selectReward: (reward: Reward) => actionBroker.route(selectReward(reward)),
    handleReroll,
    updateTimerState: (updates: Partial<typeof timerState>) =>
      actionBroker.route(updateTimerState(updates)),
    setTotalTimer: (duration: number) => actionBroker.route(setTotalTimer(duration)),
    updateFeedbackMultiplier: (feedbackMultiplier: number) =>
      actionBroker.route(updateFeedbackMultiplier(feedbackMultiplier)),
    rewards,
    sessionState,
    isPaused,
    rerolls,
    selectedReward: timerState.selectedReward,
  };
};
