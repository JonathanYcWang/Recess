import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './StorageContext';
import {
  DEFAULT_FOCUS_TIME,
  DEFAULT_BREAK_TIME,
  DEFAULT_BACK_TO_IT_TIME,
  DEFAULT_REROLLS,
  DEFAULT_TOTAL_WORK_DURATION,
} from './constants';
import { TimerState } from './types';
import { formatTime as formatTimeUtil } from './utils';
import { useRewardLogic } from './useRewardLogic';

const TIMER_STATE_KEY = 'timerState';

const DEFAULT_TIMER_STATE: TimerState = {
  sessionState: 'BEFORE_SESSION',
  initialWorkSessionDuration: DEFAULT_TOTAL_WORK_DURATION,
  workSessionDurationRemaining: DEFAULT_TOTAL_WORK_DURATION,
  initialFocusSessionDuration: DEFAULT_FOCUS_TIME,
  initialBreakSessionDuration: DEFAULT_BREAK_TIME,
  focusSessionDurationRemaining: DEFAULT_FOCUS_TIME,
  breakSessionDurationRemaining: DEFAULT_BREAK_TIME,
  
  backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
  rerolls: DEFAULT_REROLLS,
  selectedReward: null,
  pausedFrom: null,

  nextFocusDuration: DEFAULT_FOCUS_TIME,
  nextBreakDuration: DEFAULT_BREAK_TIME,
  lastFocusSessionCompleted: false,
  generatedRewards: [],
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
  actualFocusRemaining: number,
  lastCompleted: boolean,
  nextFocusDuration: number
): Partial<TimerState> => {
  const completedInSegment = Math.max(0, initialFocusDuration - actualFocusRemaining);
  const newWorkRemaining = Math.max(0, currentWorkRemaining - completedInSegment);

  if (newWorkRemaining <= 0) {
    return {
      sessionState: 'SESSION_COMPLETE',
      focusSessionDurationRemaining: nextFocusDuration,
      workSessionDurationRemaining: 0,
      focusSessionEntryTimeStamp: undefined,
      initialFocusSessionDuration: nextFocusDuration,
      lastFocusSessionCompleted: lastCompleted,
    };
  }
  
  return {
    sessionState: 'REWARD_SELECTION',
    focusSessionDurationRemaining: nextFocusDuration,
    workSessionDurationRemaining: newWorkRemaining,
    focusSessionEntryTimeStamp: undefined,
    initialFocusSessionDuration: nextFocusDuration,
    lastFocusSessionCompleted: lastCompleted,
  };
};

export const useTimerState = () => {
  const { get, set, isReady } = useStorage();
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT_TIMER_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setTick] = useState(0); // Force re-render for UI updates
  
  const { rewards, selectReward, handleReroll } = useRewardLogic(timerState, setTimerState);

  // Load timer state from storage on mount
  useEffect(() => {
    if (isReady && !isLoaded) {
      get<TimerState>(TIMER_STATE_KEY).then((savedState) => {
        if (savedState) {
          // Merge with DEFAULT_TIMER_STATE to ensure new properties like generatedRewards exist
          setTimerState({ ...DEFAULT_TIMER_STATE, ...savedState });
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
                         remaining,
                         true, // lastCompleted = true (natural end)
                         timerState.nextFocusDuration
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
                        breakSessionDurationRemaining: timerState.nextBreakDuration,
                        backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
                        breakSessionEntryTimeStamp: undefined,
                        initialBreakSessionDuration: timerState.nextBreakDuration,
                    };
                }
                break;
            }
            case 'BACK_TO_IT': {
                if (timerState.backToItTimeRemaining <= 1) {
                    shouldUpdateState = true;
                    nextState = {
                        sessionState: 'DURING_SESSION',
                        focusSessionDurationRemaining: timerState.nextFocusDuration,
                        backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
                        focusSessionEntryTimeStamp: Date.now(),
                        initialFocusSessionDuration: timerState.nextFocusDuration,
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
    setTimerState({ ...DEFAULT_TIMER_STATE });
  }, []);

  // Start focus session
  const startFocusSession = useCallback(() => {
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
        // Freeze current time using helper if active session
        // If BACK_TO_IT, we don't have a timestamp, just current value in state is sufficient (as it's just a counter)
        
        // We only care about calculating active focus time if we are in DURING_SESSION
        let currentRemaining = prev.focusSessionDurationRemaining;
        if (prev.sessionState === 'DURING_SESSION') {
            currentRemaining = calculateRemaining(
                prev.initialFocusSessionDuration, 
                prev.focusSessionEntryTimeStamp
            );
        }
        
        let pausedFrom = prev.sessionState as 'DURING_SESSION' | 'BACK_TO_IT';
        if (prev.sessionState !== 'DURING_SESSION' && prev.sessionState !== 'BACK_TO_IT') {
             if (prev.sessionState === 'PAUSED') return prev;
             pausedFrom = 'DURING_SESSION';
        }

        return {
            ...prev,
            sessionState: 'PAUSED',
            focusSessionDurationRemaining: currentRemaining, // save this
            focusSessionEntryTimeStamp: undefined,
            pausedFrom: pausedFrom,
        };
    });
  }, []);

  // Resume session
  const resumeSession = useCallback(() => {
    setTimerState((prev) => {
        const resumeTo = prev.pausedFrom || 'DURING_SESSION'; // Default
        
        if (resumeTo === 'BACK_TO_IT') {
             return {
                 ...prev,
                 sessionState: 'BACK_TO_IT',
                 pausedFrom: null,
             };
        } else {
            // Resume to DURING_SESSION
            return {
                ...prev,
                sessionState: 'DURING_SESSION',
                focusSessionEntryTimeStamp: Date.now(),
                initialFocusSessionDuration: prev.focusSessionDurationRemaining,
                pausedFrom: null,
            };
        }
    });
  }, []);

  // End session early (merges endBreakEarly and endSessionEarly)
  const endSessionEarly = useCallback(() => {
    setTimerState((prev) => {
        // Break case
        if (prev.sessionState === 'BREAK') {
             return {
                ...prev,
                sessionState: 'BACK_TO_IT',
                breakSessionEntryTimeStamp: undefined,
                backToItTimeRemaining: DEFAULT_BACK_TO_IT_TIME,
             };
        }

        // Session case (DURING_SESSION or PAUSED)
        // Calculate current remaining if active
        let actualRemaining = prev.focusSessionDurationRemaining;
        if (prev.sessionState === 'DURING_SESSION') {
            actualRemaining = calculateRemaining(prev.initialFocusSessionDuration, prev.focusSessionEntryTimeStamp);
        }

        return {
            ...prev,
            ...getNextFocusState(
                prev.workSessionDurationRemaining, 
                prev.initialFocusSessionDuration, 
                actualRemaining,
                false, // lastCompleted = false (early end)
                prev.nextFocusDuration
            )
        };
    });
  }, []);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    return formatTimeUtil(seconds);
  }, []);

  return {
    timerState: derivedTimerState, // Expose the derived state to the UI
    updateTimerState,
    resetTimerState,
    startFocusSession,
    pauseSession,
    resumeSession,
    selectReward,
    handleReroll,
    endSessionEarly,
    rewards,
    formatTime,
    isLoaded,
  };
};
