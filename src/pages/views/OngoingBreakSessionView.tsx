import React from 'react';
import CountdownTimer from '../../components/CountdownTimer';
import RewardLink from '../../components/RewardLink';
import TertiaryButton from '../../components/TertiaryButton';
import { Reward } from '../../lib/types';
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
        <TertiaryButton text="Wrap up break early" onClick={endSessionEarly} />
      </div>
    </>
  );
};

export default OngoingBreakSessionView;
