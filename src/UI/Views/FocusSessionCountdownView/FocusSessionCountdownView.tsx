import { useState, useEffect } from 'react';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import Button from '@/UI/Components/Button/Button';
import EnergyCheckDialog from '@/UI/Components/EnergyCheckDialog/EnergyCheckDialog';
import { useTimer } from '@/UI/Hooks/useTimer';
import PlayIcon from '../../../Assets/Icons/play.svg?url';
import styles from './FocusSessionCountdownView.module.css';

const FocusSessionCountdownView = () => {
  const { startWorkSession, endWorkSession, phaseDuration, phaseRemaining } =
    useTimer();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleEmojiSelect = (emoji: 'pain' | 'meh' | 'smile') => {
    switch (emoji) {
      case 'pain':
        // updateFeedbackMultiplier(0.5);
        break;
      case 'meh':
        // Do nothing - keep weights at default
        break;
      case 'smile':
        // Increase momentum weight by 50%
        // updateFeedbackMultiplier(1.5);
        break;
    }
  };

  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Alright, Back To It.</p>
        <p className={styles.caption}>Next focus session is starting soon.</p>
      </div>
      <FocusTimer
        timer={phaseDuration}
        remainingTimer={phaseRemaining}
        label="starting in"
      />
      <div className={styles.contentContainer}>
        <Button
          text="Start Focus Session Now"
          onClick={startWorkSession}
          iconSrc={PlayIcon}
          variant="primary"
        />
        <Button text="End Work Session Early" onClick={endWorkSession} variant="tertiary" />
      </div>
      <EnergyCheckDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onEmojiSelect={handleEmojiSelect}
      />
    </>
  );
};

export default FocusSessionCountdownView;
