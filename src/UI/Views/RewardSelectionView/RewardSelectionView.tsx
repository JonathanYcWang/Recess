import SecondaryTimerDescription from '@/UI/Components/SecondaryTimerDescription/SecondaryTimerDescription';
import CardCarousel, { CardCarouselItem } from '@/UI/Components/CardCarousel/CardCarousel';
import { Reward } from '@/Shared/Types/AppState';
import { useRecessPicker } from '@/UI/Hooks/useRecessPicker';
import { formatWorkSessionTime } from '../../../Shared/Utils/TimerService';
import styles from './RewardSelectionView.module.css';

const RewardSelectionView = () => {
  const { recessOptions, rerolls, selectRecess, rerollRecessOption } = useRecessPicker();
  const rewardCards: CardCarouselItem[] = recessOptions.map((recess: Reward, index: number) => ({
    id: recess.id,
    title: formatWorkSessionTime(recess.duration),
    description: recess.name,
    onClick: () => selectRecess(recess),
    refreshOnClick: () => rerollRecessOption(index),
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
