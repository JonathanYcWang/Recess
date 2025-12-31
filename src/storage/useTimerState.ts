import { useState, useEffect, useCallback, useRef } from 'react';
import { useStorage } from './StorageContext';
import {
  DEFAULT_FOCUS_TIME,
  DEFAULT_BREAK_TIME,
  DEFAULT_BACK_TO_IT_TIME,
  DEFAULT_REROLLS,
  DEFAULT_TOTAL_WORK_DURATION,
} from './constants';
import { SessionState, Reward } from './types';
import { formatTime as formatTimeUtil } from './utils';

export interface TimerState {
  sessionState: SessionState;
  
  // Requested Variables
  workSessionDurationRemaining: number;
  initialWorkSessionDuration: number;
  initialFocusSessionDuration: number;
  initialBreakSessionDuration: number;
  focusSessionDurationRemaining: number;
  breakSessionDurationRemaining: number;
  focusSessionEntryTimeStamp?: number;
  breakSessionEntryTimeStamp?: number;

  // Other necessary state
  backToItTimeRemaining: number;
  rerolls: number;
  selectedReward: Reward | null;
}

const TIMER_STATE_KEY = 'timerState';

const DEFAULT_TIMER_STATE: TimerState = {
  sessionState: 'BEFORE_SESSION',
  workSessionDurationRemaining: DEFAULT_TOTAL_WORK_DURATION,
  initialWorkSessionDuration: DEFAULT_TOTAL_WORK_DURATION,
  initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
  initialBreakSessionDuration: DEFAULT_BREAK_TIME,
  focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
  breakSessionDurationRemaining: DEFAULT_BREAK_TIME,
  
  backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
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
          setTimerState(savedState);
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

  // Focus session timer countdown
  useEffect(() => {
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }

    if (
      timerState.sessionState === 'DURING_SESSION' &&
      timerState.focusSessionEntryTimeStamp
    ) {
      focusIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (!prev.focusSessionEntryTimeStamp) return prev;

          const currentTimeStamp = Date.now();
          const elapsedSinceEntry = Math.floor((currentTimeStamp - prev.focusSessionEntryTimeStamp) / 1000);
          // focusSessionDurationRemaining = initialFocusSessionDuration - (currentTimeStamp - focusSessionEntryTimeStamp)
          const newRemaining = Math.max(0, prev.initialFocusSessionDuration - elapsedSinceEntry);

          if (newRemaining <= 0) {
            // Timer ran out
            // Reduced workSessionDurationRemaining by completedFocusSessionDuration
            // completedFocusSessionDuration = initialFocusSessionDuration - focusSessionDurationRemaining
            // Here: initialFocusSessionDuration (at entry) - 0 = initialFocusSessionDuration
            
            const completedFocusSessionDuration = prev.initialFocusSessionDuration;
            const newWorkSessionRemaining = Math.max(0, prev.workSessionDurationRemaining - completedFocusSessionDuration);

            if (newWorkSessionRemaining <= 0) {
              return {
                ...prev,
                sessionState: 'SESSION_COMPLETE',
                focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
                workSessionDurationRemaining: 0,
                focusSessionEntryTimeStamp: undefined,
                initialFocusSessionDuration: DEFAULT_FOCUS_TIME, // Reset logic for cleanliness
              };
            }

            return {
              ...prev,
              sessionState: 'REWARD_SELECTION',
              focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
              workSessionDurationRemaining: newWorkSessionRemaining,
              focusSessionEntryTimeStamp: undefined,
              initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
            };
          }

          return {
            ...prev,
            focusSessionDurationRemaining: newRemaining,
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
  }, [timerState.sessionState, timerState.initialFocusSessionDuration, timerState.focusSessionEntryTimeStamp]);

  // Break timer countdown
  useEffect(() => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }

    if (
      timerState.sessionState === 'BREAK' &&
      timerState.breakSessionEntryTimeStamp
    ) {
      breakIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (!prev.breakSessionEntryTimeStamp) return prev;

          const currentTimeStamp = Date.now();
          const elapsedSinceEntry = Math.floor((currentTimeStamp - prev.breakSessionEntryTimeStamp) / 1000);
          const newRemaining = Math.max(0, prev.initialBreakSessionDuration - elapsedSinceEntry);

          if (newRemaining <= 0) {
            return {
              ...prev,
              sessionState: 'BACK_TO_IT',
              breakSessionDurationRemaining: DEFAULT_BREAK_TIME,
              backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
              breakSessionEntryTimeStamp: undefined,
              initialBreakSessionDuration: DEFAULT_BREAK_TIME,
            };
          }

          return {
            ...prev,
            breakSessionDurationRemaining: newRemaining,
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
  }, [timerState.sessionState, timerState.initialBreakSessionDuration, timerState.breakSessionEntryTimeStamp]);

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
              focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
              backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
              
              focusSessionEntryTimeStamp: Date.now(),
              initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
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
      focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
      focusSessionEntryTimeStamp: Date.now(),
      initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
    }));
  }, []);

  // Pause session
  const pauseSession = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'PAUSED',
      // Stop tracking, keep existing values stable.
      focusSessionEntryTimeStamp: undefined,
      // We don't change initialFocusSessionDuration here, or we can clear it.
      // But we need it for the 'resume' logic if we want to infer.
      // Actually, we just need 'focusSessionDurationRemaining' to stay as is.
      // So we do nothing to it.
    }));
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'DURING_SESSION',
      focusSessionEntryTimeStamp: Date.now(),
      initialFocusSessionDuration: prev.focusSessionDurationRemaining, // Continue from where we left off
    }));
  }, []);

  // Select reward and start break
  const selectReward = useCallback((reward: Reward) => {
    setTimerState((prev) => ({
      ...prev,
      selectedReward: reward,
      breakSessionDurationRemaining: DEFAULT_BREAK_TIME,
      sessionState: 'BREAK',
      breakSessionEntryTimeStamp: Date.now(),
      initialBreakSessionDuration: DEFAULT_BREAK_TIME,
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
      breakSessionEntryTimeStamp: undefined,
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

  // End session early
  const endSessionEarly = useCallback(() => {
    setTimerState((prev) => {
      // Logic: completed = initial - remaining
      const completedInSegment = Math.max(0, prev.initialFocusSessionDuration - prev.focusSessionDurationRemaining);
      const newWorkSessionRemaining = Math.max(0, prev.workSessionDurationRemaining - completedInSegment);

      if (newWorkSessionRemaining <= 0) {
        return {
          ...prev,
          sessionState: 'SESSION_COMPLETE',
          focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
          workSessionDurationRemaining: 0,
          focusSessionEntryTimeStamp: undefined,
          initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
        };
      }

      return {
        ...prev,
        sessionState: 'REWARD_SELECTION',
        focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
        workSessionDurationRemaining: newWorkSessionRemaining,
        focusSessionEntryTimeStamp: undefined,
        initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
      };
    });
  }, []);

  // Rewards list
  const rewards: Reward[] = [
    { id: '1', name: 'Netflix', duration: '15 min' },
    { id: '2', name: 'Tiktok', duration: '10 min' },
    { id: '3', name: 'Instagram', duration: '5 min' },
  ];

  // Format time helper
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
