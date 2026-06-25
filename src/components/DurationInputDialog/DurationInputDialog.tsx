import { useState, useEffect } from 'react';

import { PrimitiveDialog, PrimitiveSlider } from '@/primitives';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import TimesIcon from '../../assets/times.svg?url';

import styles from './DurationInputDialog.module.css';

interface DurationInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (time: number) => void;
  duration?: number;
}

const minutesToDisplay = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes == 0) {
    return `${hours}h`;
  }

  return `${hours}h:${remainingMinutes}m`;
};

const minutesToSeconds = (minutes: number): number => {
  return minutes * 60;
};

const secondsToMinutes = (seconds: number): number => {
  return Math.round(seconds / 60);
};

const PRESET_TIMES_MINUTES = [30, 60, 90, 120, 180];
const DurationInputDialog = ({
  isOpen,
  onClose,
  onConfirm,
  duration = 60,
}: DurationInputDialogProps) => {
  const [time, setTime] = useState(() => secondsToMinutes(duration));

  useEffect(() => {
    onConfirm(minutesToSeconds(time));
  }, [time, onConfirm]);

  return (
    <PrimitiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Set Work Duration"
    >
      <div className={styles.dialogBody}>
        <div className={styles.headerContainer}>
          <Icon src={TimesIcon} alt="Close" size="sm" onClick={onClose} />
        </div>
        <p className={styles.description}>{minutesToDisplay(time)}</p>
        <PrimitiveSlider
          label="Work Session Duration"
          value={time}
          step={15}
          minValue={15}
          maxValue={480}
          onChange={setTime}
        />
        <div className={styles.presetTimes}>
          {PRESET_TIMES_MINUTES.map((minutes) => (
            <Button
              key={minutes}
              text={minutesToDisplay(minutes)}
              onClick={() => setTime(minutes)}
              variant="secondary"
            />
          ))}
        </div>
      </div>
    </PrimitiveDialog>
  );
};

export default DurationInputDialog;
