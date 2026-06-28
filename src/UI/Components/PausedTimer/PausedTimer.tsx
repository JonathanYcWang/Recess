import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTime } from '@/services/timerService';
import styles from './PausedTimer.module.css';

const PAUSE_OVERDUE_SECONDS = 1 * 60;
const RADIUS = 154;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PausedTimerProps {
  label?: string;
  description?: string;
}

const PausedTimer = ({
  label = 'On break',
  description = 'Paused Focus Session',
}: PausedTimerProps) => {
  const timerStartedAtRef = useRef(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    timerStartedAtRef.current = Date.now();

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - timerStartedAtRef.current) / 1000)));
    };

    updateElapsed();
    const intervalId = setInterval(updateElapsed, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const isOverdue = elapsedSeconds >= PAUSE_OVERDUE_SECONDS;
  const progress = Math.min(elapsedSeconds / PAUSE_OVERDUE_SECONDS, 1);
  const strokeDashoffset = useMemo(() => CIRCUMFERENCE - progress * CIRCUMFERENCE, [progress]);

  return (
    <div
      className={`${styles.pausedTimer} ${isOverdue ? styles.overdue : ''}`}
      aria-label={`${description}, ${formatTime(elapsedSeconds)} elapsed`}
      aria-live="polite"
    >
      <svg className={styles.ringSvg} viewBox="0 0 320 320" aria-hidden="true">
        <circle
          className={styles.ringTrack}
          cx="160"
          cy="160"
          r={RADIUS}
          strokeWidth="12"
          fill="none"
        />
        <circle
          className={styles.ringProgress}
          cx="160"
          cy="160"
          r={RADIUS}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset,
          }}
        />
      </svg>

      <div className={styles.timerDisplay}>
        <p className={styles.labelText}>{description}</p>
        <p className={styles.timeText}>{formatTime(elapsedSeconds)}</p>
        <p className={styles.labelText}>{isOverdue ? 'Time to get back!' : label}</p>
      </div>
    </div>
  );
};

export default PausedTimer;
