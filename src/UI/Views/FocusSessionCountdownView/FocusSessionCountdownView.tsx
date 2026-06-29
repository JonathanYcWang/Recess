import { useState, useEffect } from 'react';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import Button from '@/UI/Components/Button/Button';
import EnergyCheckDialog from '@/UI/Components/EnergyCheckDialog/EnergyCheckDialog';
import PlayIcon from '../../../Assets/Icons/play.svg?url';
import styles from './FocusSessionCountdownView.module.css';

interface FocusSessionCountdownViewProps {
  currentTimer: number;
  currentRemaining: number;
  startFocusSession: () => void;
  updateFeedbackMultiplier: (feedbackMultiplier: number) => void;
  endWorkSessionEarly: () => void;
}

const FocusSessionCountdownView = ({
  currentTimer,
  currentRemaining,
  startFocusSession,
  updateFeedbackMultiplier,
  endWorkSessionEarly,
}: FocusSessionCountdownViewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Open the dialog when the component mounts
    setDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleEmojiSelect = (emoji: 'pain' | 'meh' | 'smile') => {
    switch (emoji) {
      case 'pain':
        updateFeedbackMultiplier(0.5);
        break;
      case 'meh':
        // Do nothing - keep weights at default
        break;
      case 'smile':
        // Increase momentum weight by 50%
        updateFeedbackMultiplier(1.5);
        break;
    }
  };

  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Alright, Back To It.</p>
        <p className={styles.caption}>Next focus session is starting soon.</p>
      </div>
      <FocusTimer timer={currentTimer} remainingTimer={currentRemaining} label="starting in" />
      <div className={styles.contentContainer}>
        <Button
          text="Start Focus Session Now"
          onClick={startFocusSession}
          iconSrc={PlayIcon}
          variant="primary"
        />
        <Button text="End Work Session Early" onClick={endWorkSessionEarly} variant="tertiary" />
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
