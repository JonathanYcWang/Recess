import React from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import SecondaryButton from '../../components/SecondaryButton';
import PauseIcon from '../../assets/pause.svg?url';

interface DuringSessionViewProps {
  focusSessionDurationRemaining: number;
  formatTime: (seconds: number) => string;
  pauseSession: () => void;
}

const DuringSessionView: React.FC<DuringSessionViewProps> = ({
  focusSessionDurationRemaining,
  formatTime,
  pauseSession,
}) => {
  return (
    <>
      <SecondaryTimerDescription text="Active Session" />
      <CountdownTimer time={formatTime(focusSessionDurationRemaining)} label="Remaining" />
      <SecondaryButton text="Pause Session" onClick={pauseSession} iconSrc={PauseIcon} />
    </>
  );
};

export default DuringSessionView;
