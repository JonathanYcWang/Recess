import { Reward } from '../../lib/types';
import { MAX_REWARD_TIME, REWARD_TIME_INTERVAL } from '../../lib/constants';

/**
 * Service for generating rewards based on blocked sites
 * Encapsulates reward generation business logic
 */
export class RewardService {
  private static getCombinationKey(site: string, minutes: number): string {
    return `${site}-${minutes}`;
  }

  /**
   * Generate all possible reward combinations for given sites
   */
  static getAllPossibleCombinations(sites: string[]): Array<{ site: string; minutes: number }> {
    const numIntervals = Math.floor(MAX_REWARD_TIME / REWARD_TIME_INTERVAL);
    return sites.flatMap((site) =>
      Array.from({ length: numIntervals }, (_, i) => ({
        site,
        minutes: (i + 1) * REWARD_TIME_INTERVAL,
      }))
    );
  }

  /**
   * Generate a single reward avoiding previously shown combinations
   */
  static generateReward(
    availableSites: string[],
    shownCombinations: string[]
  ): { reward: Reward; combinationKey: string } | null {
    if (availableSites.length === 0) return null;

    const allPossibleCombinations = this.getAllPossibleCombinations(availableSites);

    const availableCombinations = allPossibleCombinations.filter(
      (combo) => !shownCombinations.includes(this.getCombinationKey(combo.site, combo.minutes))
    );

    const combinationsToUse =
      availableCombinations.length > 0 ? availableCombinations : allPossibleCombinations;

    const randomCombo = combinationsToUse[Math.floor(Math.random() * combinationsToUse.length)];
    const combinationKey = this.getCombinationKey(randomCombo.site, randomCombo.minutes);

    return {
      reward: {
        id: `${randomCombo.site}-${Date.now()}-${Math.random()}`,
        name: randomCombo.site,
        duration: `${randomCombo.minutes} min`,
        durationSeconds: randomCombo.minutes * 60,
      },
      combinationKey,
    };
  }

  /**
   * Generate multiple rewards at once
   */
  static generateRewards(
    availableSites: string[],
    count: number,
    shownCombinations: string[] = []
  ): { rewards: Reward[]; newCombinations: string[] } {
    const rewards: Reward[] = [];
    const combinations = [...shownCombinations];

    for (let i = 0; i < count; i++) {
      const result = this.generateReward(availableSites, combinations);
      if (result) {
        rewards.push(result.reward);
        combinations.push(result.combinationKey);
      }
    }

    return {
      rewards,
      newCombinations: combinations.slice(shownCombinations.length),
    };
  }
}
