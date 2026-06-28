import SecondaryTimerDescription from '../../Components/SecondaryTimerDescription/SecondaryTimerDescription';
import CardCarousel, { CardCarouselItem } from '../../Components/CardCarousel/CardCarousel';
import { Reward } from '@/types/reward';
import { useTimer } from '../../Hooks/useTimer';
import { formatWorkSessionTime } from '@/services/timerService';
import styles from './RewardSelectionView.module.css';

interface RewardSelectionViewProps {
  selectReward: (reward: Reward) => void;
  handleReroll: (index: number) => void;
}

const RewardSelectionView = ({ selectReward, handleReroll }: RewardSelectionViewProps) => {
  const { rewards, rerolls } = useTimer();
  const rewardCards: CardCarouselItem[] = rewards.map((reward: Reward, index: number) => ({
    id: reward.id,
    title: formatWorkSessionTime(reward.duration),
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
