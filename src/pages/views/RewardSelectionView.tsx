import React from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CardCarousel, { CardCarouselItem } from '../../components/CardCarousel';
import { Reward } from '../../lib/types';
import styles from '../MainPage.module.css';

interface RewardSelectionViewProps {
  rewards: Reward[];
  rerolls: number;
  selectReward: (reward: Reward) => void;
  handleReroll: (index: number) => void;
}

const RewardSelectionView: React.FC<RewardSelectionViewProps> = ({
  rewards,
  rerolls,
  selectReward,
  handleReroll,
}) => {
  const rewardCards: CardCarouselItem[] = rewards.map((reward: Reward, index: number) => ({
    id: reward.id,
    title: reward.duration,
    description: reward.name,
    onClick: () => selectReward(reward),
    refreshOnClick: () => handleReroll(index),
  }));

  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Break Time!</p>
        <p className={styles.caption}>Choose how you recharge.</p>
      </div>
      <div className={styles.contentContainer}>
        <SecondaryTimerDescription text={`Re-rolls left: ${rerolls}`} />
        <CardCarousel cards={rewardCards} />
      </div>
    </>
  );
};

export default RewardSelectionView;
