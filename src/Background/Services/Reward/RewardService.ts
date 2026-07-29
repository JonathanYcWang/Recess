import { DEFAULT_BREAK_DURATION_SECONDS, REWARD_OPTIONS_COUNT } from '@/Shared/Constants/Constants';
import type { BlockListValue } from '@/Background/Services/BlockListManagement/BlockListManagementService';
import type { Reward } from '@/Shared/Types/Reward';

const getRandomCombo = (
  blockListValue: BlockListValue
): { site: string; duration: number; rewardKey: string } => {
  const site = blockListValue.entries[Math.floor(Math.random() * blockListValue.entries.length)];
  const duration = DEFAULT_BREAK_DURATION_SECONDS;
  const rewardKey = `${site}-${duration}`;
  return {
    site,
    duration,
    rewardKey,
  };
};

export const generateReward = (blockList: BlockListValue): Reward => {
  const { site, duration, rewardKey } = getRandomCombo(blockList);
  return {
    id: rewardKey,
    name: site,
    duration,
  };
};

export const generateRewardSet = (blockList: BlockListValue): Reward[] =>
  Array.from({ length: REWARD_OPTIONS_COUNT }, () => generateReward(blockList));
