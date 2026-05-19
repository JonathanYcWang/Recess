import { useState, useEffect } from 'react';

import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import TimesIcon from '../../assets/times.svg?url';
import Slider from '@mui/material/Slider';

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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.headerContainer}>
          <h2 className={styles.title}>Set Work Duration</h2>
          <Icon src={TimesIcon} alt="Close" size={16} onClick={onClose} />
        </div>
        <p className={styles.description}>{minutesToDisplay(time)}</p>
        <Slider
          sx={{
            color: 'var(--recess-black)',
            height: 8,

            '& .MuiSlider-thumb': {
              height: 20,
              width: 20,
              backgroundColor: 'var(--recess-white)',
              border: '2px solid currentColor',
            },
          }}
          aria-label="Work Session Duration"
          value={time}
          step={15}
          min={15}
          max={480}
          onChange={(_e: Event, value: number) => setTime(value)}
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
    </div>
  );
};

export default DurationInputDialog;
