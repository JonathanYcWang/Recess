import React from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import PlayIcon from '../../assets/play.svg?url';
import PauseIcon from '../../assets/pause.svg?url';
import { formatWorkSessionTime } from '../../lib/timer-utils';
import styles from '../MainPage.module.css';

interface BackToItViewProps {
  workSessionDurationRemaining: number;
  backToItTimeRemaining: number;
  formatTime: (seconds: number) => string;
  startFocusSession: () => void;
  pauseSession: () => void;
}

const BackToItView: React.FC<BackToItViewProps> = ({
  workSessionDurationRemaining,
  backToItTimeRemaining,
  formatTime,
  startFocusSession,
  pauseSession,
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
      <CountdownTimer time={formatTime(backToItTimeRemaining)} label="starting in" />
      <div className={styles.contentContainer}>
        <PrimaryButton text="Start Session" onClick={startFocusSession} iconSrc={PlayIcon} />
        <SecondaryButton text="Hold On" onClick={pauseSession} iconSrc={PauseIcon} />
      </div>
    </>
  );
};

export default BackToItView;
