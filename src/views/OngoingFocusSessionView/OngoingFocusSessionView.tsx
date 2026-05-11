import SecondaryTimerDescription from '../../components/SecondaryTimerDescription/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer';
import Button from '../../components/Button/Button';
import PauseIcon from '../../assets/pause.svg?url';
import PlayIcon from '../../assets/play.svg?url';
import styles from './OngoingFocusSessionView.module.css';

interface OngoingFocusSessionViewProps {
  focusSessionDurationRemaining: number;
  isPaused: boolean;
  formatTime: (seconds: number) => string;
  pauseSession: () => void;
  resumeSession: () => void;
  endSessionEarly: () => void;
}

const OngoingFocusSessionView = ({
  focusSessionDurationRemaining,
  isPaused,
  formatTime,
  pauseSession,
  resumeSession,
  endSessionEarly,
}: OngoingFocusSessionViewProps) => {
  return (
    <>
      <SecondaryTimerDescription
        text={isPaused ? 'Paused Focus Session' : 'Active Focus Session'}
      />
      <CountdownTimer time={formatTime(focusSessionDurationRemaining)} label="Remaining" />
      {isPaused ? (
        <div className={styles.contentContainer}>
          <Button
            text="Resume Focus Session"
            onClick={resumeSession}
            iconSrc={PlayIcon}
            variant="primary"
          />
          <Button text="Wrap up focus session early" onClick={endSessionEarly} variant="tertiary" />
        </div>
      ) : (
        <Button
          text="Pause Focus Session"
          onClick={pauseSession}
          iconSrc={PauseIcon}
          variant="secondary"
        />
      )}
    </>
  );
};

export default OngoingFocusSessionView;
