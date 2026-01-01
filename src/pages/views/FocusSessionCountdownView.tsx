import React from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import PrimaryButton from '../../components/PrimaryButton';
import PlayIcon from '../../assets/play.svg?url';
import { formatWorkSessionTime } from '../../lib/timer-utils';
import styles from '../MainPage.module.css';

interface FocusSessionCountdownViewProps {
  workSessionDurationRemaining: number;
  focusSessionCountdownTimeRemaining: number;
  formatTime: (seconds: number) => string;
  startFocusSession: () => void;
}

const FocusSessionCountdownView: React.FC<FocusSessionCountdownViewProps> = ({
  workSessionDurationRemaining,
  focusSessionCountdownTimeRemaining,
  formatTime,
  startFocusSession,
}) => {
  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Alright, Back To It.</p>
        <p className={styles.caption}>Next focus session is starting soon.</p>
      </div>
      <SecondaryTimerDescription
        text={`${formatWorkSessionTime(workSessionDurationRemaining)} To Go`}
      />
      <CountdownTimer time={formatTime(focusSessionCountdownTimeRemaining)} label="starting in" />
      <div className={styles.contentContainer}>
        <PrimaryButton
          text="Start Focus Session Now"
          onClick={startFocusSession}
          iconSrc={PlayIcon}
        />
      </div>
    </>
  );
};

export default FocusSessionCountdownView;
