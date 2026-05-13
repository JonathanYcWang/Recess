import { useState } from 'react';
import { Time } from '@internationalized/date';

import Button from '../Button/Button';
import { TimeField } from '../TimeField/TimeField';

import styles from './DurationInputDialog.module.css';

interface DurationInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (time: number) => void;
  duration?: number;
}

export const secondsToTime = (seconds: number): Time => {
  const clamped = Math.min(seconds, 23 * 3600 + 59 * 60);

  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);

  return new Time(hours, minutes);
};

export const timeToSeconds = (time: Time): number => {
  return time.hour * 3600 + time.minute * 60 + time.second;
};

const DurationInputDialog = ({
  isOpen,
  onClose,
  onConfirm,
  duration = 60,
}: DurationInputDialogProps) => {
  const [time, setTime] = useState(() => secondsToTime(duration));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onConfirm(timeToSeconds(time));
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>Set Work Session Duration</h2>
        <p className={styles.description}>Duration (Hours:Minutes)</p>
        <form
          onSubmit={handleSubmit}
          onKeyDownCapture={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        >
          <div className={styles.inputContainer}>
            <TimeField
              aria-label="Duration (Hours:Minutes)"
              value={time}
              onChange={(value) => value && setTime(value)}
              hourCycle={24}
            />
          </div>

          <div className={styles.buttonContainer}>
            <Button text="Cancel" onClick={onClose} variant="secondary" type="button" />
            <Button text="Confirm" variant="primary" type="submit" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default DurationInputDialog;
