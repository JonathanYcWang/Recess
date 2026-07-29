import type { RootState } from '../../store';
import type { RewardsState } from '@/Shared/Types/AppState';
import type { Reward } from '@/Shared/Types/Reward';
import { DEFAULT_REROLLS } from '@/Shared/Constants/Constants';

const selectRewardsState = (state: RootState): RewardsState =>
  state.appState?.rewardsState ?? {
    rerolls: DEFAULT_REROLLS,
    selectedReward: null,
    rewards: [],
  };

export const selectGeneratedRewards = (state: RootState): Reward[] =>
  selectRewardsState(state).rewards;
export const selectRerolls = (state: RootState): number => selectRewardsState(state).rerolls;
export const selectSelectedReward = (state: RootState) => selectRewardsState(state).selectedReward;


