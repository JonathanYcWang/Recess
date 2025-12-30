import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '../storage/StorageContext';
import {
  DEFAULT_FOCUS_TIME,
  DEFAULT_BREAK_TIME,
  DEFAULT_BACK_TO_IT_TIME,
  DEFAULT_REROLLS,
} from '../storage/constants';
import { SessionState, Reward } from '../storage/types';
import { formatTime as formatTimeUtil } from '../storage/utils';

export interface SessionStateData {
  sessionState: SessionState;
  focusTimeRemaining: number;
  breakTimeRemaining: number;
  backToItTimeRemaining: number;
  pausedTimeRemaining: number;
  rerolls: number;
  selectedReward: Reward | null;
}

export interface UseSessionStateReturn {
  // State
  sessionState: SessionState;
  focusTimeRemaining: number;
  breakTimeRemaining: number;
  backToItTimeRemaining: number;
  pausedTimeRemaining: number;
  rerolls: number;
  selectedReward: Reward | null;
  rewards: Reward[];

  // Actions
  handleStartSession: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleSelectReward: (reward: Reward) => void;
  handleReroll: (index: number) => void;
  handleEndBreakEarly: () => void;
  handleHoldOn: () => void;
  handleEndSessionEarly: () => void;

  // Utilities
  formatTime: (seconds: number) => string;
}

const SESSION_STATE_KEY = 'sessionState';

export const useSessionState = (): UseSessionStateReturn => {
  const { get, set, isReady } = useStorage();
  const [sessionState, setSessionState] = useState<SessionState>('BEFORE_SESSION');
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(DEFAULT_FOCUS_TIME);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(DEFAULT_BREAK_TIME);
  const [backToItTimeRemaining, setBackToItTimeRemaining] = useState(DEFAULT_BACK_TO_IT_TIME);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState(0);
  const [rerolls, setRerolls] = useState(DEFAULT_REROLLS);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load session state from storage on mount
  useEffect(() => {
    if (isReady && !isLoaded) {
      get<SessionStateData>(SESSION_STATE_KEY).then((savedState) => {
        if (savedState) {
          setSessionState(savedState.sessionState);
          setFocusTimeRemaining(savedState.focusTimeRemaining);
          setBreakTimeRemaining(savedState.breakTimeRemaining);
          setBackToItTimeRemaining(savedState.backToItTimeRemaining);
          setPausedTimeRemaining(savedState.pausedTimeRemaining);
          setRerolls(savedState.rerolls);
          setSelectedReward(savedState.selectedReward);
        }
        setIsLoaded(true);
      });
    }
  }, [isReady, isLoaded, get]);

  // Save session state to storage whenever it changes (after initial load)
  useEffect(() => {
    if (isReady && isLoaded) {
      const stateToSave: SessionStateData = {
        sessionState,
        focusTimeRemaining,
        breakTimeRemaining,
        backToItTimeRemaining,
        pausedTimeRemaining,
        rerolls,
        selectedReward,
      };
      set(SESSION_STATE_KEY, stateToSave);
    }
  }, [
    sessionState,
    focusTimeRemaining,
    breakTimeRemaining,
    backToItTimeRemaining,
    pausedTimeRemaining,
    rerolls,
    selectedReward,
    isReady,
    isLoaded,
    set,
  ]);

  const rewards: Reward[] = [
    { id: '1', name: 'Netflix', duration: '15 min' },
    { id: '2', name: 'Tiktok', duration: '10 min' },
    { id: '3', name: 'Instagram', duration: '5 min' },
  ];

  // Format time helper (using shared utility)
  const formatTime = useCallback((seconds: number): string => {
    return formatTimeUtil(seconds);
  }, []);

  // Focus session timer
  useEffect(() => {
    if (sessionState === 'DURING_SESSION') {
      const interval = setInterval(() => {
        setFocusTimeRemaining((prev) => {
          if (prev <= 0) {
            setSessionState('REWARD_SELECTION');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionState]);

  // Break timer
  useEffect(() => {
    if (sessionState === 'BREAK') {
      const interval = setInterval(() => {
        setBreakTimeRemaining((prev) => {
          if (prev <= 0) {
            setSessionState('BACK_TO_IT');
            setBackToItTimeRemaining(DEFAULT_BACK_TO_IT_TIME);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionState]);

  // Back to it timer
  useEffect(() => {
    if (sessionState === 'BACK_TO_IT') {
      const interval = setInterval(() => {
        setBackToItTimeRemaining((prev) => {
          if (prev <= 0) {
            setSessionState('DURING_SESSION');
            setFocusTimeRemaining(DEFAULT_FOCUS_TIME);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionState]);

  // Actions
  const handleStartSession = () => {
    setFocusTimeRemaining(DEFAULT_FOCUS_TIME);
    setSessionState('DURING_SESSION');
  };

  const handlePause = () => {
    setPausedTimeRemaining(focusTimeRemaining);
    setSessionState('PAUSED');
  };

  const handleResume = () => {
    if (pausedTimeRemaining > 0) {
      setFocusTimeRemaining(pausedTimeRemaining);
    }
    setSessionState('DURING_SESSION');
  };

  const handleSelectReward = (reward: Reward) => {
    setSelectedReward(reward);
    setBreakTimeRemaining(DEFAULT_BREAK_TIME);
    setSessionState('BREAK');
  };

  const handleReroll = (_index: number) => {
    if (rerolls > 0) {
      setRerolls(rerolls - 1);
    }
  };

  const handleEndBreakEarly = () => {
    setSessionState('BACK_TO_IT');
    setBackToItTimeRemaining(DEFAULT_BACK_TO_IT_TIME);
  };

  const handleHoldOn = () => {
    setSessionState('BEFORE_SESSION');
  };

  const handleEndSessionEarly = () => {
    setSessionState('REWARD_SELECTION');
  };

  return {
    // State
    sessionState,
    focusTimeRemaining,
    breakTimeRemaining,
    backToItTimeRemaining,
    pausedTimeRemaining,
    rerolls,
    selectedReward,
    rewards,

    // Actions
    handleStartSession,
    handlePause,
    handleResume,
    handleSelectReward,
    handleReroll,
    handleEndBreakEarly,
    handleHoldOn,
    handleEndSessionEarly,

    // Utilities
    formatTime,
  };
};
