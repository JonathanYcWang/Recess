import Button from '@/UI/Components/Button/Button';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import { useTimer } from '@/UI/Hooks/useTimer';
import PlayIcon from '@/Assets/Icons/play.svg';

const BeforeWorkSessionView = () => {
  const { startWorkSession, phaseDuration } = useTimer();

  return (
    <>
      <FocusTimer timer={phaseDuration} label="Next focus session length" description="" />
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
