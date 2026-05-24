import { useState } from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer';
import Button from '../../components/Button/Button';
import DurationInputDialog from '../../components/DurationInputDialog/DurationInputDialog';
import PlayIcon from '../../assets/play.svg?url';
import { formatWorkSessionTime, formatTime } from '../../services/timerService';

interface BeforeWorkSessionViewProps {
  totalRemaining: number;
  nextFocusDuration: number;
  startFocusSession: () => void;
  onDurationChange: (duration: number) => void;
}

const BeforeWorkSessionView = ({
  totalRemaining,
  nextFocusDuration,
  startFocusSession,
  onDurationChange,
}: BeforeWorkSessionViewProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <SecondaryTimerDescription
        text={`${formatWorkSessionTime(totalRemaining)} To Go`}
        onClick={() => setIsDialogOpen(true)}
      />
      <CountdownTimer time={formatTime(nextFocusDuration)} label="Next focus session length" />
      <Button
        text="Start Focus Session"
        onClick={startFocusSession}
        iconSrc={PlayIcon}
        variant="primary"
      />

      {/* <div className={styles.illustration}>
        <img src="/assets/cow.png" alt="pet-illustration" />
      </div> */}

      <DurationInputDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={onDurationChange}
        duration={totalRemaining}
      />
    </>
  );
};

export default BeforeWorkSessionView;
