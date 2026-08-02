import type { BlockListEntry } from '@/Shared/Types/AppState';
import type { Reward } from '@/Shared/Types/AppState';
import { DEFAULT_BREAK_DURATION_SECONDS, REWARD_OPTIONS_COUNT } from '@/Shared/Constants/Constants';

const getRandomCombo = (
  blockList: BlockListEntry[]
): { site: string; duration: number; rewardKey: string } => {
  const site = blockList[Math.floor(Math.random() * blockList.length)].url;
  const duration = DEFAULT_BREAK_DURATION_SECONDS;
  const rewardKey = `${site}-${duration}`;
  return {
    site,
    duration,
    rewardKey,
  };
};

export const generateReward = (blockList: BlockListEntry[]): Reward => {
  const { site, duration, rewardKey } = getRandomCombo(blockList);
  return {
    id: rewardKey,
    name: site,
    duration,
  };
};

export const generateRewardSet = (blockList: BlockListEntry[]): Reward[] =>
  Array.from({ length: REWARD_OPTIONS_COUNT }, () => generateReward(blockList));
