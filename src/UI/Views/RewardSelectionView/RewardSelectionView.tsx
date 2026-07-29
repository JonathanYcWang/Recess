import SecondaryTimerDescription from '@/UI/Components/SecondaryTimerDescription/SecondaryTimerDescription';
import CardCarousel, { CardCarouselItem } from '@/UI/Components/CardCarousel/CardCarousel';
import { Reward } from '@/Shared/Types/Reward';
import { useRewards } from '@/UI/Hooks/useRewards';
import { formatWorkSessionTime } from '../../../Shared/Utils/TimerService';
import styles from './RewardSelectionView.module.css';

const RewardSelectionView = () => {
  const { rewards, rerolls, selectReward, handleReroll } = useRewards();
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
