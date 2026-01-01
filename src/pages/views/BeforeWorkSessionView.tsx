import React, { useState } from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import PrimaryButton from '../../components/PrimaryButton';
import DurationInputDialog from '../../components/DurationInputDialog';
import PlayIcon from '../../assets/play.svg?url';
import { formatWorkSessionTime } from '../../lib/timer-utils';

interface BeforeWorkSessionViewProps {
  workSessionDurationRemaining: number;
  nextFocusDuration: number;
  formatTime: (seconds: number) => string;
  startFocusSession: () => void;
  onDurationChange?: (durationInMinutes: number) => void;
}

const BeforeWorkSessionView: React.FC<BeforeWorkSessionViewProps> = ({
  workSessionDurationRemaining,
  nextFocusDuration,
  formatTime,
  startFocusSession,
  onDurationChange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDurationConfirm = (hours: number, minutes: number) => {
    const totalMinutes = hours * 60 + minutes;
    if (onDurationChange && totalMinutes > 0) {
      onDurationChange(totalMinutes);
    }
  };

  return (
    <>
      <SecondaryTimerDescription
        text={`${formatWorkSessionTime(workSessionDurationRemaining)} To Go`}
        onClick={() => setIsDialogOpen(true)}
      />
      <CountdownTimer time={formatTime(nextFocusDuration)} label="Next focus session length" />
      <PrimaryButton text="Start Focus Session" onClick={startFocusSession} iconSrc={PlayIcon} />

      <DurationInputDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDurationConfirm}
        currentDurationMinutes={Math.floor(workSessionDurationRemaining / 60)}
      />
    </>
  );
};

export default BeforeWorkSessionView;
