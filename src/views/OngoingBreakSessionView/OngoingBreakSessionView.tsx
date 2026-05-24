import CountdownTimer from '../../components/CountdownTimer/CountdownTimer';
import RewardLink from '../../components/RewardLink/RewardLink';
import Button from '../../components/Button/Button';
import { Reward } from '../../types/reward';
import styles from './OngoingBreakSessionView.module.css';

import { formatTime } from '../../services/timerService';
interface OngoingBreakSessionViewProps {
  sessionDurationRemaining: number;
  selectedReward: Reward | null;
  endSessionEarly: () => void;
}

const OngoingBreakSessionView = ({
  sessionDurationRemaining,
  selectedReward,
  endSessionEarly,
}: OngoingBreakSessionViewProps) => {
  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Time To Recharge</p>
        <p className={styles.caption}>
          Give your brain a pause, and you'll crush the next focus session.
        </p>
      </div>
      <CountdownTimer time={formatTime(sessionDurationRemaining)} label="Remaining" />
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
