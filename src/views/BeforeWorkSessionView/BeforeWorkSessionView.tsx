import { useCallback, useState } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { setPendingFocusTaskIds } from '@/modules/task-planner';

import SecondaryTimerDescription from '../../components/SecondaryTimerDescription/SecondaryTimerDescription';
import FocusTimer from '../../components/FocusTimer/FocusTimer';
import DurationInputDialog from '../../components/DurationInputDialog/DurationInputDialog';
import TaskPlanner from '../../components/TaskPlanner/TaskPlanner';
import PlayIcon from '../../assets/play.svg?url';
import WorkRhythmActionButton from '../shared/WorkRhythmActionButton';

interface BeforeWorkSessionViewProps {
  startFocusSession: () => void;
  onDurationChange: (duration: number) => void;
}

const BeforeWorkSessionView = ({
  startFocusSession,
  onDurationChange,
}: BeforeWorkSessionViewProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmedTaskIds, setConfirmedTaskIds] = useState<string[]>([]);
  const { currentTimer, totalRemaining } = useTimer();
  const handleSelectionChange = useCallback((taskIds: string[]) => {
    setConfirmedTaskIds(taskIds);
  }, []);
  const handleStartFocusSession = () => {
    setPendingFocusTaskIds(confirmedTaskIds);
    startFocusSession();
  };

  return (
    <>
      <SecondaryTimerDescription text={'Set work duration'} onClick={() => setIsDialogOpen(true)} />
      <FocusTimer timer={currentTimer} label="Next focus session length" description={''} />
      <TaskPlanner
        scheduledFocusSeconds={totalRemaining}
        onSelectionChange={handleSelectionChange}
      />
      <WorkRhythmActionButton
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
