import RewardLink from '@/UI/Components/RewardLink/RewardLink';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import Button from '@/UI/Components/Button/Button';
import { useTimer } from '@/UI/Hooks/useTimer';

import styles from './OngoingBreakSessionView.module.css';

interface OngoingBreakSessionViewProps {
  currentTimer: number;
  currentRemaining: number;
  endSessionEarly: () => void;
}

const OngoingBreakSessionView = ({
  currentTimer,
  currentRemaining,
  endSessionEarly,
}: OngoingBreakSessionViewProps) => {
  const { selectedReward } = useTimer();
  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Time To Recharge</p>
        <p className={styles.caption}>
          Give your brain a pause, and you'll crush the next focus session.
        </p>
      </div>
      <FocusTimer
        timer={currentTimer}
        remainingTimer={currentRemaining}
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
