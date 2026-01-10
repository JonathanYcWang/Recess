import React, { useState } from 'react';
import { Time } from '@internationalized/date';
import { TimeField, DateInput } from './ui/timefield';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import styles from './DurationInputDialog.module.css';

interface DurationInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hours: number, minutes: number) => void;
  currentDurationMinutes?: number;
}

const DurationInputDialog: React.FC<DurationInputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDurationMinutes = 60,
}) => {
  const initialHours = Math.floor(currentDurationMinutes / 60);
  const initialMinutes = currentDurationMinutes % 60;

  const [time, setTime] = useState<Time>(new Time(initialHours, initialMinutes));

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(time.hour, time.minute);
    onClose();
  };

  const handleTimeChange = (value: Time | null) => {
    if (value) setTime(value);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>Set Work Session Duration</h2>
        <p className={styles.description}>How long would you like to work for?</p>

        <div className={styles.inputContainer}>
          <label className={styles.label}>Duration (Hours:Minutes)</label>
          <TimeField value={time} onChange={handleTimeChange} hourCycle={24}>
            <DateInput />
          </TimeField>
        </div>

        <div className={styles.buttonContainer}>
          <SecondaryButton text="Cancel" onClick={onClose} />
          <PrimaryButton text="Confirm" onClick={handleConfirm} />
        </div>
      </div>
    </div>
  );
};

export default DurationInputDialog;
