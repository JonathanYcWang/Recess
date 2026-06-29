import styles from './FocusTimer.module.css';
import { formatTime } from '../../Shared/Utils/TimerService';
import { FOCUS_TIMER_RADIUS } from '@/Shared/Constants/Constants';

interface FocusTimerProps {
  label: string;
  description?: string;
  timer: number;
  remainingTimer?: number;
}

const FocusTimer = ({
  timer,
  remainingTimer = timer,
  label,
  description = '',
}: FocusTimerProps) => {
  const circumference = 2 * Math.PI * FOCUS_TIMER_RADIUS;

  const progress = timer > 0 ? (timer - remainingTimer) / timer : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className={styles.focusTimer} aria-live="polite">
      <svg className={styles.ringSvg} viewBox="0 0 320 320" aria-hidden="true">
        <circle
          className={styles.ringTrack}
          cx="160"
          cy="160"
          r={FOCUS_TIMER_RADIUS}
          strokeWidth="12"
          fill="none"
        />
        <circle
          className={styles.ringProgress}
          cx="160"
          cy="160"
          r={FOCUS_TIMER_RADIUS}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>

      <div className={styles.timerDisplay}>
        <p className={styles.labelText}>{description}</p>
        <p className={styles.timeText}>{formatTime(remainingTimer)}</p>
        <p className={styles.labelText}>{label}</p>
      </div>
    </div>
  );
};

export default FocusTimer;
