import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { RewardService } from '../services/rewardService';
import {
  setGeneratedRewards,
  addShownRewardCombination,
  rerollReward as rerollRewardAction,
} from '../slices/timerSlice';
import { selectBlockedSites } from '../selectors/blockedSitesSelectors';
import { selectShownRewardCombinations, selectRerolls } from '../selectors/timerSelectors';

/**
 * Thunk to generate initial rewards for reward selection
 */
export const generateInitialRewards = createAsyncThunk<void, void, { state: RootState }>(
  'timer/generateInitialRewards',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const blockedSites = selectBlockedSites(state);
    const shownCombinations = selectShownRewardCombinations(state);

    if (blockedSites.length === 0) {
      return;
    }

    const { rewards, newCombinations } = RewardService.generateRewards(
      blockedSites,
      3,
      shownCombinations
    );

    dispatch(setGeneratedRewards(rewards));
    newCombinations.forEach((combination) => {
      dispatch(addShownRewardCombination(combination));
    });
  }
);

/**
 * Thunk to reroll a reward at a specific index
 */
export const rerollReward = createAsyncThunk<void, number, { state: RootState }>(
  'timer/rerollReward',
  async (index, { getState, dispatch }) => {
    const state = getState();
    const rerolls = selectRerolls(state);
    const blockedSites = selectBlockedSites(state);
    const shownCombinations = selectShownRewardCombinations(state);

    if (rerolls <= 0 || blockedSites.length === 0) {
      return;
    }

    const result = RewardService.generateReward(blockedSites, shownCombinations);
    if (result) {
      dispatch(rerollRewardAction({ index, newReward: result.reward }));
      dispatch(addShownRewardCombination(result.combinationKey));
    }
  }
);
