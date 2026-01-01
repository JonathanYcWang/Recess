import React from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import SecondaryButton from '../../components/SecondaryButton';
import PrimaryButton from '../../components/PrimaryButton';
import TertiaryButton from '../../components/TertiaryButton';
import PauseIcon from '../../assets/pause.svg?url';
import PlayIcon from '../../assets/play.svg?url';
import styles from '../MainPage.module.css';

interface OngoingFocusSessionViewProps {
  focusSessionDurationRemaining: number;
  isPaused: boolean;
  formatTime: (seconds: number) => string;
  pauseSession: () => void;
  resumeSession: () => void;
  endSessionEarly: () => void;
}

const OngoingFocusSessionView: React.FC<OngoingFocusSessionViewProps> = ({
  focusSessionDurationRemaining,
  isPaused,
  formatTime,
  pauseSession,
  resumeSession,
  endSessionEarly,
}) => {
  return (
    <>
      <SecondaryTimerDescription
        text={isPaused ? 'Paused Focus Session' : 'Active Focus Session'}
      />
      <CountdownTimer time={formatTime(focusSessionDurationRemaining)} label="Remaining" />
      {isPaused ? (
        <div className={styles.contentContainer}>
          <PrimaryButton text="Resume Focus Session" onClick={resumeSession} iconSrc={PlayIcon} />
          <TertiaryButton text="Wrap up focus session early" onClick={endSessionEarly} />
        </div>
      ) : (
        <SecondaryButton text="Pause Focus Session" onClick={pauseSession} iconSrc={PauseIcon} />
      )}
    </>
  );
};

export default OngoingFocusSessionView;
