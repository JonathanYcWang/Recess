import { Reward } from '../types/reward';
import { calculateBreakDuration } from './sessionDurationService';
import { MAX_REWARD_GENERATION_RETRIES } from '../constants/constants';

const getCombinationKey = (site: string, seconds: number): string => `${site}-${seconds}`;

const createReward = (site: string, duration: number, rewardKey: string): Reward => {
  return {
    id: rewardKey,
    name: site,
    duration: `${duration * 60} min`,
    durationSeconds: duration,
  };
};

const getRandomCombo = (
  sites: string[],
  fatigueScore: number,
  momentumScore: number
): { site: string; duration: number; rewardKey: string } => {
  const blockedSites = [...sites];
  const site = blockedSites[Math.floor(Math.random() * blockedSites.length)];
  const duration = calculateBreakDuration(fatigueScore, momentumScore);
  const rewardKey = getCombinationKey(site, duration);
  return {
    site,
    duration,
    rewardKey,
  };
};

export const generateReward = (
  sites: Set<string>,
  shownCombinations: string[],
  fatigueScore: number,
  momentumScore: number
): Reward => {
  const blockedSites = [...sites];

  for (let i = 0; i < MAX_REWARD_GENERATION_RETRIES; i++) {
    const { site, duration, rewardKey } = getRandomCombo(blockedSites, fatigueScore, momentumScore);
    if (!shownCombinations.includes(rewardKey)) {
      shownCombinations.push(rewardKey);
      return createReward(site, duration, rewardKey);
    }
  }

  const { site, duration, rewardKey } = getRandomCombo(blockedSites, fatigueScore, momentumScore);
  shownCombinations.push(rewardKey);
  return createReward(site, duration, rewardKey);
};
