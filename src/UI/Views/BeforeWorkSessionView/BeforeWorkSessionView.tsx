import { useState } from 'react';
import { useTimer } from '@/UI/Hooks/useTimer';

import SecondaryTimerDescription from '@/UI/Components/SecondaryTimerDescription/SecondaryTimerDescription';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import Button from '@/UI/Components/Button/Button';
import DurationInputDialog from '@/UI/Components/DurationInputDialog/DurationInputDialog';
// import TaskPlanner from '../../components/TaskPlanner/TaskPlanner';
import PlayIcon from '../../../assets/play.svg?url';

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

  const handleStartFocusSession = () => {
    startFocusSession();
  };

  return (
    <>
      <SecondaryTimerDescription text={'Set work duration'} onClick={() => setIsDialogOpen(true)} />
      <FocusTimer timer={currentTimer} label="Next focus session length" description={''} />

      <Button
        text="Start Focus Session"
        onClick={handleStartFocusSession}
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
