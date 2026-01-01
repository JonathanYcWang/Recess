import React from 'react';
import CountdownTimer from '../../components/CountdownTimer';
import RewardLink from '../../components/RewardLink';
import TertiaryButton from '../../components/TertiaryButton';
import { Reward } from '../../lib/types';
import styles from '../MainPage.module.css';

interface BreakViewProps {
  breakSessionDurationRemaining: number;
  selectedReward: Reward | null;
  formatTime: (seconds: number) => string;
  endSessionEarly: () => void;
}

const BreakView: React.FC<BreakViewProps> = ({
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
          Give your brain a pause, and you'll crush the next session.
        </p>
      </div>
      <CountdownTimer time={formatTime(breakSessionDurationRemaining)} label="Remaining" />
      <div className={styles.contentContainer}>
        {selectedReward && <RewardLink siteName={selectedReward.name} status="Site Unlocked" />}
        <TertiaryButton text="Wrap up session early" onClick={endSessionEarly} />
      </div>
      <div className={styles.illustration}>
        <div className={styles.illustrationContainer}>
          <img src="/assets/cow.png" alt="Cow illustration" className={styles.cowImage} />
        </div>
      </div>
    </>
  );
};

export default BreakView;
