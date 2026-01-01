import React, { useState, useEffect } from 'react';
import SecondaryTimerDescription from '../../components/SecondaryTimerDescription';
import CountdownTimer from '../../components/CountdownTimer';
import PrimaryButton from '../../components/PrimaryButton';
import EnergyCheckDialog from '../../components/EnergyCheckDialog';
import PlayIcon from '../../assets/play.svg?url';
import { formatWorkSessionTime } from '../../lib/timer-utils';
import styles from '../MainPage.module.css';

interface FocusSessionCountdownViewProps {
  workSessionDurationRemaining: number;
  focusSessionCountdownTimeRemaining: number;
  formatTime: (seconds: number) => string;
  startFocusSession: () => void;
  updateWeightMultipliers: (multipliers: {
    fatigueMultiplier?: number;
    momentumMultiplier?: number;
  }) => void;
}

const FocusSessionCountdownView: React.FC<FocusSessionCountdownViewProps> = ({
  workSessionDurationRemaining,
  focusSessionCountdownTimeRemaining,
  formatTime,
  startFocusSession,
  updateWeightMultipliers,
}) => {
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
      <CountdownTimer time={formatTime(focusSessionCountdownTimeRemaining)} label="starting in" />
      <div className={styles.contentContainer}>
        <PrimaryButton
          text="Start Focus Session Now"
          onClick={startFocusSession}
          iconSrc={PlayIcon}
        />
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
