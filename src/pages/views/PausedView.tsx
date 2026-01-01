import React from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import PrimaryButton from '../../components/PrimaryButton';
import TertiaryButton from '../../components/TertiaryButton';
import PlayIcon from '../../assets/play.svg?url';
import styles from '../MainPage.module.css';

interface PausedViewProps {
  focusSessionDurationRemaining: number;
  backToItTimeRemaining: number;
  pausedFrom: 'DURING_SESSION' | 'BACK_TO_IT' | null;
  formatTime: (seconds: number) => string;
  resumeSession: () => void;
  endSessionEarly: () => void;
}

const PausedView: React.FC<PausedViewProps> = ({
  focusSessionDurationRemaining,
  backToItTimeRemaining,
  pausedFrom,
  formatTime,
  resumeSession,
  endSessionEarly,
}) => {
  const pausedTime =
    pausedFrom === 'BACK_TO_IT' ? backToItTimeRemaining : focusSessionDurationRemaining;
  const pausedLabel = pausedFrom === 'BACK_TO_IT' ? 'starting in' : 'Remaining';

  return (
    <>
      <SecondaryTimerDescription text="Paused Session" />
      <CountdownTimer time={formatTime(pausedTime)} label={pausedLabel} />
      <div className={styles.contentContainer}>
        <PrimaryButton text="Resume Session" onClick={resumeSession} iconSrc={PlayIcon} />
        <TertiaryButton text="Wrap up session early" onClick={endSessionEarly} />
      </div>
    </>
  );
};

export default PausedView;
