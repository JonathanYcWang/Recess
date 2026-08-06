import Button from '@/UI/Components/Button/Button';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import TimeInput from '@/UI/Components/TimeInput/TimeInput';
import { useTimer } from '@/UI/Hooks/useTimer';
import { PHASE_DURATION } from '@/Shared/Constants/Constants';
import PlayIcon from '@/Assets/Icons/play.svg';

const BeforeWorkSessionView = () => {
  const { startWorkSession } = useTimer();

  return (
    <>
      <TimeInput />
      <FocusTimer
        timer={PHASE_DURATION.FOCUS_BLOCK}
        label="Next focus session length"
        description=""
      />
      <Button
        text="Start Work Session"
        onClick={startWorkSession}
        iconSrc={PlayIcon}
        variant="primary"
      />
    </>
  );
};

export default BeforeWorkSessionView;
