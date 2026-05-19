import { useState, useEffect } from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer';
import Button from '../../components/Button/Button';
import EnergyCheckDialog from '../../components/EnergyCheckDialog/EnergyCheckDialog';
import PlayIcon from '../../assets/play.svg?url';
import { formatWorkSessionTime } from '../../services/timerService';
import styles from './FocusSessionCountdownView.module.css';

interface FocusSessionCountdownViewProps {
  workSessionDurationRemaining: number;
  sessionDurationRemaining: number;
  formatTime: (seconds: number) => string;
  startFocusSession: () => void;
  updateWeightMultipliers: (multipliers: {
    fatigueMultiplier?: number;
    momentumMultiplier?: number;
  }) => void;
  endWorkSessionEarly: () => void;
}

const FocusSessionCountdownView = ({
  workSessionDurationRemaining,
  sessionDurationRemaining,
  formatTime,
  startFocusSession,
  updateWeightMultipliers,
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
        // Increase fatigue weight by 50%
        updateWeightMultipliers({ fatigueMultiplier: 1.5 });
        break;
      case 'meh':
        // Do nothing - keep weights at default
        break;
      case 'smile':
        // Increase momentum weight by 50%
        updateWeightMultipliers({ momentumMultiplier: 1.5 });
        break;
    }
  };

  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Alright, Back To It.</p>
        <p className={styles.caption}>Next focus session is starting soon.</p>
      </div>
      <SecondaryTimerDescription
        text={`${formatWorkSessionTime(workSessionDurationRemaining)} To Go`}
      />
      <CountdownTimer time={formatTime(sessionDurationRemaining)} label="starting in" />
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
