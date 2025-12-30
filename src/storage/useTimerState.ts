import { useState, useEffect, useCallback, useRef } from 'react';
import { useStorage } from './StorageContext';
import {
  DEFAULT_FOCUS_TIME,
  DEFAULT_BREAK_TIME,
  DEFAULT_BACK_TO_IT_TIME,
  DEFAULT_REROLLS,
} from './constants';
import { SessionState, Reward } from './types';
import { formatTime as formatTimeUtil } from './utils';

export interface TimerState {
  sessionState: SessionState;
  focusTimeRemaining: number;
  breakTimeRemaining: number;
  backToItTimeRemaining: number;
  pausedTimeRemaining: number;
  rerolls: number;
  selectedReward: Reward | null;
  sessionStartTime?: number; // Timestamp when session started (for accurate time calculation across popup/tab switches)
  initialFocusTime?: number; // Initial focus time when session started (for accurate calculation)
  breakStartTime?: number; // Timestamp when break started
  initialBreakTime?: number; // Initial break time when break started
  pauseStartTime?: number; // Timestamp when paused (for accurate pause duration)
}

const TIMER_STATE_KEY = 'timerState';

const DEFAULT_TIMER_STATE: TimerState = {
  sessionState: 'BEFORE_SESSION',
  focusTimeRemaining: DEFAULT_FOCUS_TIME,
  breakTimeRemaining: DEFAULT_BREAK_TIME,
  backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
  pausedTimeRemaining: 0,
  rerolls: DEFAULT_REROLLS,
  selectedReward: null,
};

export const useTimerState = () => {
  const { get, set, isReady } = useStorage();
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT_TIMER_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backToItIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load timer state from storage on mount
  useEffect(() => {
    if (isReady && !isLoaded) {
      get<TimerState>(TIMER_STATE_KEY).then((savedState) => {
        if (savedState) {
          // Calculate actual remaining time based on timestamps if session is active
          let adjustedState = { ...savedState };

          if (savedState.sessionStartTime && savedState.sessionState === 'DURING_SESSION') {
            const initialTime = savedState.initialFocusTime || DEFAULT_FOCUS_TIME;
            const elapsed = Math.floor((Date.now() - savedState.sessionStartTime) / 1000);
            const newRemaining = Math.max(0, initialTime - elapsed);
            adjustedState.focusTimeRemaining = newRemaining;
            adjustedState.initialFocusTime = initialTime;

            // If time ran out while away, transition to reward selection
            if (newRemaining <= 0) {
              adjustedState.sessionState = 'REWARD_SELECTION';
              adjustedState.sessionStartTime = undefined;
              adjustedState.initialFocusTime = undefined;
              adjustedState.focusTimeRemaining = DEFAULT_FOCUS_TIME;
            }
          }

          if (savedState.breakStartTime && savedState.sessionState === 'BREAK') {
            const initialTime = savedState.initialBreakTime || DEFAULT_BREAK_TIME;
            const elapsed = Math.floor((Date.now() - savedState.breakStartTime) / 1000);
            const newRemaining = Math.max(0, initialTime - elapsed);
            adjustedState.breakTimeRemaining = newRemaining;
            adjustedState.initialBreakTime = initialTime;

            if (newRemaining <= 0) {
              adjustedState.sessionState = 'BACK_TO_IT';
              adjustedState.breakStartTime = undefined;
              adjustedState.initialBreakTime = undefined;
              adjustedState.breakTimeRemaining = DEFAULT_BREAK_TIME;
              adjustedState.backToItTimeRemaining = DEFAULT_BACK_TO_IT_TIME;
            }
          }

          setTimerState(adjustedState);
        }
        setIsLoaded(true);
      });
    }
  }, [isReady, isLoaded, get]);

  // Save timer state to storage whenever it changes (after initial load)
  useEffect(() => {
    if (isReady && isLoaded) {
      set(TIMER_STATE_KEY, timerState);
    }
  }, [timerState, isReady, isLoaded, set]);

  // Focus session timer countdown (only runs during DURING_SESSION state)
  useEffect(() => {
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }

    if (
      timerState.sessionState === 'DURING_SESSION' &&
      timerState.sessionStartTime &&
      timerState.initialFocusTime
    ) {
      focusIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (!prev.sessionStartTime || !prev.initialFocusTime) return prev;

          const elapsed = Math.floor((Date.now() - prev.sessionStartTime!) / 1000);
          const newRemaining = Math.max(0, prev.initialFocusTime - elapsed);

          if (newRemaining <= 0) {
            // Timer ran out, transition to reward selection and reset timer
            return {
              ...prev,
              sessionState: 'REWARD_SELECTION',
              focusTimeRemaining: DEFAULT_FOCUS_TIME,
              sessionStartTime: undefined,
              initialFocusTime: undefined,
            };
          }

          return {
            ...prev,
            focusTimeRemaining: newRemaining,
          };
        });
      }, 1000);
    }

    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
    };
  }, [timerState.sessionState, timerState.sessionStartTime, timerState.initialFocusTime]);

  // Break timer countdown
  useEffect(() => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }

    if (
      timerState.sessionState === 'BREAK' &&
      timerState.breakStartTime &&
      timerState.initialBreakTime
    ) {
      breakIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (!prev.breakStartTime || !prev.initialBreakTime) return prev;

          const elapsed = Math.floor((Date.now() - prev.breakStartTime!) / 1000);
          const newRemaining = Math.max(0, prev.initialBreakTime - elapsed);

          if (newRemaining <= 0) {
            return {
              ...prev,
              sessionState: 'BACK_TO_IT',
              breakTimeRemaining: DEFAULT_BREAK_TIME,
              backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
              breakStartTime: undefined,
              initialBreakTime: undefined,
            };
          }

          return {
            ...prev,
            breakTimeRemaining: newRemaining,
          };
        });
      }, 1000);
    }

    return () => {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
    };
  }, [timerState.sessionState, timerState.breakStartTime, timerState.initialBreakTime]);

  // Back to it timer countdown
  useEffect(() => {
    if (backToItIntervalRef.current) {
      clearInterval(backToItIntervalRef.current);
      backToItIntervalRef.current = null;
    }

    if (timerState.sessionState === 'BACK_TO_IT') {
      backToItIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (prev.backToItTimeRemaining <= 1) {
            return {
              ...prev,
              sessionState: 'DURING_SESSION',
              focusTimeRemaining: DEFAULT_FOCUS_TIME,
              backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
              sessionStartTime: Date.now(),
              initialFocusTime: DEFAULT_FOCUS_TIME,
            };
          }

          return {
            ...prev,
            backToItTimeRemaining: prev.backToItTimeRemaining - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (backToItIntervalRef.current) {
        clearInterval(backToItIntervalRef.current);
        backToItIntervalRef.current = null;
      }
    };
  }, [timerState.sessionState]);

  // Update timer state
  const updateTimerState = useCallback((updates: Partial<TimerState>) => {
    setTimerState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset timer state to default
  const resetTimerState = useCallback(() => {
    setTimerState(DEFAULT_TIMER_STATE);
  }, []);

  // Start focus session
  const startSession = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'DURING_SESSION',
      focusTimeRemaining: DEFAULT_FOCUS_TIME,
      sessionStartTime: Date.now(),
      initialFocusTime: DEFAULT_FOCUS_TIME,
    }));
  }, []);

  // Pause session (stops the timer)
  const pauseSession = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'PAUSED',
      pausedTimeRemaining: prev.focusTimeRemaining,
      sessionStartTime: undefined, // Stop the timer
      initialFocusTime: undefined,
    }));
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'DURING_SESSION',
      focusTimeRemaining: prev.pausedTimeRemaining,
      sessionStartTime: Date.now(),
      initialFocusTime: prev.pausedTimeRemaining,
      pausedTimeRemaining: 0,
    }));
  }, []);

  // Select reward and start break
  const selectReward = useCallback((reward: Reward) => {
    setTimerState((prev) => ({
      ...prev,
      selectedReward: reward,
      breakTimeRemaining: DEFAULT_BREAK_TIME,
      sessionState: 'BREAK',
      breakStartTime: Date.now(),
      initialBreakTime: DEFAULT_BREAK_TIME,
    }));
  }, []);

  // Handle reroll
  const handleReroll = useCallback((_index: number) => {
    setTimerState((prev) => ({
      ...prev,
      rerolls: Math.max(0, prev.rerolls - 1),
    }));
  }, []);

  // End break early
  const endBreakEarly = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'BACK_TO_IT',
      breakStartTime: undefined,
      initialBreakTime: undefined,
      backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
    }));
  }, []);

  // Hold on (go back to before session)
  const holdOn = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'BEFORE_SESSION',
    }));
  }, []);

  // End session early (go to reward selection)
  const endSessionEarly = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'REWARD_SELECTION',
      sessionStartTime: undefined,
      focusTimeRemaining: DEFAULT_FOCUS_TIME,
    }));
  }, []);

  // Rewards list (static for now)
  const rewards: Reward[] = [
    { id: '1', name: 'Netflix', duration: '15 min' },
    { id: '2', name: 'Tiktok', duration: '10 min' },
    { id: '3', name: 'Instagram', duration: '5 min' },
  ];

  // Format time helper (using shared utility)
  const formatTime = useCallback((seconds: number): string => {
    return formatTimeUtil(seconds);
  }, []);

  return {
    timerState,
    updateTimerState,
    resetTimerState,
    startSession,
    pauseSession,
    resumeSession,
    selectReward,
    handleReroll,
    endBreakEarly,
    holdOn,
    endSessionEarly,
    rewards,
    formatTime,
    isLoaded,
  };
};
