import RewardLink from '@/UI/Components/RewardLink/RewardLink';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import Button from '@/UI/Components/Button/Button';
import { useRewards } from '@/UI/Hooks/useRewards';
import { useTimer } from '@/UI/Hooks/useTimer';

import styles from './OngoingBreakSessionView.module.css';

const OngoingBreakSessionView = () => {
  const { selectedReward } = useRewards();
  const { endSessionEarly, phaseDuration, phaseRemaining } = useTimer();

  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Time To Recharge</p>
        <p className={styles.caption}>
          Give your brain a pause, and you'll crush the next focus session.
        </p>
      </div>
      <FocusTimer
        timer={phaseDuration}
        remainingTimer={phaseRemaining}
        label="Remaining"
        description={''}
      />
      <div className={styles.contentContainer}>
        {selectedReward && (
          <RewardLink
            siteName={selectedReward.name}
            status="Site Unlocked"
            siteUrl={selectedReward.name}
          />
        )}
        <Button text="Wrap up break early" onClick={endSessionEarly} variant="tertiary" />
      </div>
    </>
  );
};

export default OngoingBreakSessionView;
