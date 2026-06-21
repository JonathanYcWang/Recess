import { useState } from 'react';
import { useTimer } from '../../hooks/useTimer';

import SecondaryTimerDescription from '../../components/SecondaryTimerDescription/SecondaryTimerDescription';
import FocusTimer from '../../components/FocusTimer/FocusTimer';
import Button from '../../components/Button/Button';
import DurationInputDialog from '../../components/DurationInputDialog/DurationInputDialog';
import PlayIcon from '../../assets/play.svg?url';

interface BeforeWorkSessionViewProps {
  startFocusSession: () => void;
  onDurationChange: (duration: number) => void;
}

const BeforeWorkSessionView = ({
  startFocusSession,
  onDurationChange,
}: BeforeWorkSessionViewProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentTimer, totalRemaining } = useTimer();

  return (
    <>
      <SecondaryTimerDescription text={'Set work duration'} onClick={() => setIsDialogOpen(true)} />
      <FocusTimer timer={currentTimer} label="Next focus session length" description={''} />
      <Button
        text="Start Focus Session"
        onClick={startFocusSession}
        iconSrc={PlayIcon}
        variant="primary"
      />
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
