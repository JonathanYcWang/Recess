import React from 'react';
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer';
import RewardLink from '../../components/RewardLink/RewardLink';
import Button from '../../components/Button/Button';
import { Reward } from '../../types/reward';
import styles from '../MainPage.module.css';

interface OngoingBreakSessionViewProps {
  breakSessionDurationRemaining: number;
  selectedReward: Reward | null;
  formatTime: (seconds: number) => string;
  endSessionEarly: () => void;
}

const OngoingBreakSessionView: React.FC<OngoingBreakSessionViewProps> = ({
  breakSessionDurationRemaining,
  selectedReward,
  formatTime,
  endSessionEarly,
}) => {
  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Time To Recharge</p>
        <p className={styles.caption}>
          Give your brain a pause, and you'll crush the next focus session.
        </p>
      </div>
      <CountdownTimer time={formatTime(breakSessionDurationRemaining)} label="Remaining" />
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
