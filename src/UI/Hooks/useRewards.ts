import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { sendAppAction } from '../../Shared/ActionBrokers/ActionBroker';
import { APP_ACTION } from '../../Shared/Constants/Constants';
import { Reward } from '../../Shared/Types/Reward';
import {
  selectGeneratedRewards,
  selectRerolls,
  selectSelectedReward,
} from '../Redux/Selectors/index';

export const useRewards = () => {
  const rewards = useSelector(selectGeneratedRewards);
  const rerolls = useSelector(selectRerolls);
  const selectedReward = useSelector(selectSelectedReward);

  const selectReward = useCallback((reward: Reward) => {
    void sendAppAction({ type: APP_ACTION.REWARDS_SELECT_REWARD, reward });
  }, []);

  const handleReroll = useCallback(
    (index: number) => {
      if (rerolls > 0) {
        void sendAppAction({ type: APP_ACTION.REWARDS_REROLL_REWARD, index });
      }
    },
    [rerolls]
  );

  return {
    rewards,
    rerolls,
    selectedReward,
    selectReward,
    handleReroll,
  };
};
