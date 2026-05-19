import { Reward } from '../types/reward';
import { MAX_REWARD_TIME, REWARD_TIME_INTERVAL } from '../constants/constants';

/**
 * Get combination key for a site/time pair
 */
const getCombinationKey = (site: string, minutes: number): string => `${site}-${minutes}`;

/**
 * Generate all possible reward combinations for given sites
 */
const getAllPossibleCombinations = (sites: string[]): Array<{ site: string; minutes: number }> => {
  const numIntervals = Math.floor(MAX_REWARD_TIME / REWARD_TIME_INTERVAL);
  return sites.flatMap((site) =>
    Array.from({ length: numIntervals }, (_, i) => ({
      site,
      minutes: (i + 1) * REWARD_TIME_INTERVAL,
    }))
  );
};

/**
 * Generate a single reward avoiding previously shown combinations
 */
export const generateReward = (
  availableSites: string[],
  shownCombinations: string[]
): { reward: Reward; combinationKey: string } | null => {
  if (availableSites.length === 0) return null;

  const allPossibleCombinations = getAllPossibleCombinations(availableSites);

  const availableCombinations = allPossibleCombinations.filter(
    (combo) => !shownCombinations.includes(getCombinationKey(combo.site, combo.minutes))
  );

  const combinationsToUse =
    availableCombinations.length > 0 ? availableCombinations : allPossibleCombinations;

  const randomCombo = combinationsToUse[Math.floor(Math.random() * combinationsToUse.length)];
  const combinationKey = getCombinationKey(randomCombo.site, randomCombo.minutes);

  return {
    reward: {
      id: `${randomCombo.site}-${Date.now()}-${Math.random()}`,
      name: randomCombo.site,
      duration: `${randomCombo.minutes} min`,
      durationSeconds: randomCombo.minutes * 60,
    },
    combinationKey,
  };
};

/**
 * Generate multiple rewards at once
 */
export const generateRewards = (
  availableSites: string[],
  count: number,
  shownCombinations: string[] = []
): { rewards: Reward[]; newCombinations: string[] } => {
  const rewards: Reward[] = [];
  const combinations = [...shownCombinations];

  for (let i = 0; i < count; i++) {
    const result = generateReward(availableSites, combinations);
    if (result) {
      rewards.push(result.reward);
      combinations.push(result.combinationKey);
    }
  }

  return {
    rewards,
    newCombinations: combinations.slice(shownCombinations.length),
  };
};
