import { useState, useEffect } from 'react';

import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import { toPressableDivProps } from '@/Shared/Utils/pressable';
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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} {...toPressableDivProps(onClose)}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- stop overlay dismissal when interacting with dialog content */}
      <div className={styles.dialog} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.headerContainer}>
          <h2 className={styles.title}>Set Work Duration</h2>
          <Icon src={TimesIcon} alt="Close" size="sm" onClick={onClose} />
        </div>
        <p className={styles.description}>{minutesToDisplay(time)}</p>
        <input
          className={styles.slider}
          aria-label="Work Session Duration"
          type="range"
          value={time}
          step={15}
          min={15}
          max={480}
          onChange={(event) => setTime(Number(event.currentTarget.value))}
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
