import React from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import PrimaryButton from '../../components/PrimaryButton';
import PlayIcon from '../../assets/play.svg?url';
import { formatWorkSessionTime } from '../../lib/timer-utils';

interface BeforeSessionViewProps {
  workSessionDurationRemaining: number;
  nextFocusDuration: number;
  formatTime: (seconds: number) => string;
  startFocusSession: () => void;
}

const BeforeSessionView: React.FC<BeforeSessionViewProps> = ({
  workSessionDurationRemaining,
  nextFocusDuration,
  formatTime,
  startFocusSession,
}) => {
  return (
    <>
      <SecondaryTimerDescription
        text={`${formatWorkSessionTime(workSessionDurationRemaining)} To Go`}
      />
      <CountdownTimer time={formatTime(nextFocusDuration)} label="Next session length" />
      <PrimaryButton text="Start Session" onClick={startFocusSession} iconSrc={PlayIcon} />
    </>
  );
};

export default BeforeSessionView;
