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

/**
 * Custom hook that provides timer functionality to components
 * Directly orchestrates Redux actions and selectors - no thunks
 */
export const useTimer = () => {
  const dispatch = useDispatch<AppDispatch>();
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

  const handleExpiredSession = useCallback(
    (remaining: number) => {
      if (remaining > 0 || isPaused) {
        return;
      }

      if (sessionState === SESSION_STATES.ONGOING_FOCUS_SESSION) {
        dispatch(transitionToRewardSelection());
        return;
      }

      if (sessionState === SESSION_STATES.ONGOING_BREAK_SESSION) {
        dispatch(transitionToFocusSessionCountdown());
        return;
      }

      if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
        dispatch(transitionToFocusSession());
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
    if (sessionState === SESSION_STATES.REWARD_SELECTION && blockedSites.length > 0) {
      const seenRewardCombinations = [...shownCombinations];
      const rewards = Array.from({ length: 3 }, () =>
        generateReward(blockedSites, seenRewardCombinations, fatigueScore, momentumScore)
      );
      dispatch(setGeneratedRewards(rewards));
      dispatch(setShownRewardCombinations(seenRewardCombinations));
    }
  }, [sessionState, dispatch]);

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
            notifyFocusComplete();
            notified.focusEnd = true;
            dispatch(transitionToRewardSelection());
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
            notifyBreakComplete();
            notified.breakEnd = true;
            dispatch(transitionToFocusSessionCountdown());
            return;
          }
        }

        if (sessionState === SESSION_STATES.FOCUS_SESSION_COUNTDOWN) {
          if (remaining <= 0) {
            dispatch(transitionToFocusSession());
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
    updateFeedbackMultiplier: (feedbackMultiplier: number) =>
      dispatch(updateFeedbackMultiplier(feedbackMultiplier)),
    rewards,
    isLoaded: true,
  };
};
