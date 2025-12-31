import { useCallback, useEffect } from 'react';
import { TimerState, Reward } from './types';
import { useBlockedSites } from './useBlockedSites';
import { REWARD_TIME_INTERVAL, MAX_REWARD_TIME } from './constants';

export const useRewardLogic = (
  timerState: TimerState,
  setTimerState: React.Dispatch<React.SetStateAction<TimerState>>
) => {
  const { sites } = useBlockedSites();

  // Helper to generate a single random reward
  const generateReward = useCallback((availableSites: string[]): Reward | null => {
    if (availableSites.length === 0) return null;

    // Pick random site
    const randomSite = availableSites[Math.floor(Math.random() * availableSites.length)];

    // Pick random duration based on constants
    const numIntervals = Math.floor(MAX_REWARD_TIME / REWARD_TIME_INTERVAL);
    const minutes = Math.floor(Math.random() * numIntervals + 1) * REWARD_TIME_INTERVAL;
    
    return {
      id: `${randomSite}-${Date.now()}-${Math.random()}`, // Unique ID for React keys
      name: randomSite,
      duration: `${minutes} min`,
      durationSeconds: minutes * 60,
    };
  }, []);

  // Initialize rewards when sites are loaded and we have none in global state
  useEffect(() => {
    if (sites.length > 0 && timerState.generatedRewards.length === 0) {
      const newRewards: Reward[] = [];
      for (let i = 0; i < 3; i++) {
        const reward = generateReward(sites);
        if (reward) newRewards.push(reward);
      }
      
      setTimerState(prev => ({
        ...prev,
        generatedRewards: newRewards
      }));
    }
  }, [sites, timerState.generatedRewards.length, generateReward, setTimerState]);

  // Select reward and start break
  const selectReward = useCallback((reward: Reward) => {
    setTimerState((prev) => ({
      ...prev,
      selectedReward: reward,
      breakSessionDurationRemaining: reward.durationSeconds, // Use the specific duration
      sessionState: 'BREAK',
      breakSessionEntryTimeStamp: Date.now(),
      initialBreakSessionDuration: reward.durationSeconds,
      nextBreakDuration: reward.durationSeconds, // Ensure next break uses this time
    }));
  }, [setTimerState]);

  // Handle reroll for a specific card
  const handleReroll = useCallback((index: number) => {
    setTimerState((prev) => {
      // Only reroll if we have rerolls left
      if (prev.rerolls <= 0) return prev;
      
      // Generate new reward
      const newReward = generateReward(sites);
      if (!newReward) return prev;

      // Update global state
      const updatedRewards = [...prev.generatedRewards];
      updatedRewards[index] = newReward;

      // Decrement rerolls and update rewards
      return {
        ...prev,
        rerolls: prev.rerolls - 1,
        generatedRewards: updatedRewards
      };
    });
  }, [sites, generateReward, setTimerState]);

  return {
    rewards: timerState.generatedRewards,
    selectReward,
    handleReroll,
  };
};
