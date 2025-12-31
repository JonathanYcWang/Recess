import { useState, useEffect, useCallback } from 'react';
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

// Helper: Calculate remaining time based on timestamps
const calculateRemaining = (initialDuration: number, entryTimeStamp?: number): number => {
  if (!entryTimeStamp) return initialDuration;
  const currentTime = Date.now();
  const elapsed = Math.floor((currentTime - entryTimeStamp) / 1000);
  return Math.max(0, initialDuration - elapsed);
};

// Helper: Determine next state after a focus session triggers a completion (natural or early)
const getNextFocusState = (
  currentWorkRemaining: number, 
  initialFocusDuration: number, 
  actualFocusRemaining: number
): Partial<TimerState> => {
  const completedInSegment = Math.max(0, initialFocusDuration - actualFocusRemaining);
  const newWorkRemaining = Math.max(0, currentWorkRemaining - completedInSegment);

  if (newWorkRemaining <= 0) {
    return {
      sessionState: 'SESSION_COMPLETE',
      focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
      workSessionDurationRemaining: 0, // Ensure 0
      focusSessionEntryTimeStamp: undefined,
      initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
    };
  }
  
  return {
    sessionState: 'REWARD_SELECTION',
    focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
    workSessionDurationRemaining: newWorkRemaining,
    focusSessionEntryTimeStamp: undefined,
    initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
  };
};

export const useTimerState = () => {
  const { get, set, isReady } = useStorage();
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT_TIMER_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setTick] = useState(0); // Force re-render for UI updates

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

  // Single timer effect for all active states
  useEffect(() => {
    const activeStates = ['DURING_SESSION', 'BREAK', 'BACK_TO_IT'];
    
    if (activeStates.includes(timerState.sessionState)) {
      const UI_UPDATE_INTERVAL = 1000;

      const intervalId = setInterval(() => {
        let shouldUpdateState = false;
        let nextState: Partial<TimerState> = {};

        switch (timerState.sessionState) {
            case 'DURING_SESSION': {
                 // Check if time is up
                 const remaining = calculateRemaining(timerState.initialFocusSessionDuration, timerState.focusSessionEntryTimeStamp);
                 if (remaining <= 0) {
                     shouldUpdateState = true;
                     nextState = getNextFocusState(
                         timerState.workSessionDurationRemaining,
                         timerState.initialFocusSessionDuration,
                         remaining // 0
                     );
                 }
                 break;
            }
            case 'BREAK': {
                const remaining = calculateRemaining(timerState.initialBreakSessionDuration, timerState.breakSessionEntryTimeStamp);
                if (remaining <= 0) {
                    shouldUpdateState = true;
                    // Transition Logic
                    nextState = {
                        sessionState: 'BACK_TO_IT',
                        breakSessionDurationRemaining: DEFAULT_BREAK_TIME,
                        backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
                        breakSessionEntryTimeStamp: undefined,
                        initialBreakSessionDuration: DEFAULT_BREAK_TIME,
                    };
                }
                break;
            }
            case 'BACK_TO_IT': {
                if (timerState.backToItTimeRemaining <= 1) {
                    shouldUpdateState = true;
                    nextState = {
                        sessionState: 'DURING_SESSION',
                        focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
                        backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
                        focusSessionEntryTimeStamp: Date.now(),
                        initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
                    };
                } else {
                    shouldUpdateState = true;
                    nextState = { backToItTimeRemaining: timerState.backToItTimeRemaining - 1 };
                }
                break;
            }
        }

        if (shouldUpdateState) {
            setTimerState(prev => ({ ...prev, ...nextState }));
        } else {
            // Just trigger a re-render to update the UI with derived values
            setTick(t => t + 1);
        }

      }, UI_UPDATE_INTERVAL);

      return () => clearInterval(intervalId);
    }
  }, [timerState]);

  // DERIVED STATE for UI
  const getDerivedTimerState = (): TimerState => {
    let derived = { ...timerState };

    if (timerState.sessionState === 'DURING_SESSION') {
        derived.focusSessionDurationRemaining = calculateRemaining(
            timerState.initialFocusSessionDuration, 
            timerState.focusSessionEntryTimeStamp
        );
    } else if (timerState.sessionState === 'BREAK') {
        derived.breakSessionDurationRemaining = calculateRemaining(
            timerState.initialBreakSessionDuration,
            timerState.breakSessionEntryTimeStamp
        );
    }
    
    return derived;
  };

  const derivedTimerState = getDerivedTimerState();


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
    setTimerState((prev) => {
        // Freeze current time using helper
        const currentRemaining = calculateRemaining(
            prev.initialFocusSessionDuration, 
            prev.focusSessionEntryTimeStamp
        );

        return {
            ...prev,
            sessionState: 'PAUSED',
            focusSessionDurationRemaining: currentRemaining,
            focusSessionEntryTimeStamp: undefined,
        };
    });
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      sessionState: 'DURING_SESSION',
      focusSessionEntryTimeStamp: Date.now(),
      initialFocusSessionDuration: prev.focusSessionDurationRemaining,
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
      // Calculate current remaining
      let actualRemaining = prev.focusSessionDurationRemaining;
      
      // If we are active, calculate fresh remaining. If paused, rely on stored state.
      if (prev.sessionState === 'DURING_SESSION') {
          actualRemaining = calculateRemaining(prev.initialFocusSessionDuration, prev.focusSessionEntryTimeStamp);
      }
      
      return {
          ...prev,
          ...getNextFocusState(prev.workSessionDurationRemaining, prev.initialFocusSessionDuration, actualRemaining)
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
    timerState: derivedTimerState, // Expose the derived state to the UI
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
