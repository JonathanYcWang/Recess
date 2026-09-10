import Button from '@/UI/Components/Button/Button';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import { useTimer } from '@/UI/Hooks/useTimer';
import { SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import styles from './OngoingFocusSessionView.module.css';

const ClockIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const GiftIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 12v8H4v-8" />
    <path d="M2 8h20v4H2z" />
    <path d="M12 8v12" />
    <path d="M12 8H8.5A2.5 2.5 0 1 1 11 5.5V8z" />
    <path d="M12 8h3.5A2.5 2.5 0 1 0 13 5.5V8z" />
  </svg>
);

// const CoffeeIcon = () => (
//   <svg className={styles.statusIcon} viewBox="0 0 24 24" aria-hidden="true">
//     <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" />
//     <path d="M16 10h1a3 3 0 0 1 0 6h-1" />
//     <path d="M6 2v3" />
//     <path d="M10 2v3" />
//     <path d="M14 2v3" />
//   </svg>
// );

const formatDurationShort = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
};

const OngoingFocusSessionView = () => {
  const {
    activePhase,
    endSessionEarly,
    pause,
    resume,
    pauseElapsed,
    phaseDuration,
    phaseRemaining,
    sessionRemaining,
  } = useTimer();

  const isPaused = activePhase === SCHEDULER_PHASE.PAUSE;

  return (
    <>
      <div className={styles.timerHeader}>
        <div className={styles.statusPill}>
          <ClockIcon />
        </div>
      </div>

      <FocusTimer
        timer={isPaused ? pauseElapsed : phaseDuration}
        remainingTimer={isPaused ? pauseElapsed : phaseRemaining}
        label={isPaused ? 'Elapsed' : 'Remaining'}
        description={isPaused ? 'Paused' : 'Active Focus Session'}
      />

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.giftIconBox}>
            <GiftIcon />
          </div>
          <div className={styles.summaryCopy}>
            <p className={styles.summaryLabel}>Total left today</p>
            <p className={styles.summaryValue}>{formatDurationShort(sessionRemaining)}</p>
          </div>
        </div>
      </div>

      {isPaused ? (
        <Button text="Resume Focus" onClick={resume} variant="primary" />
      ) : (
        <Button text="Pause" onClick={pause} variant="secondary" />
      )}
      <Button text="End Work Session Early" onClick={endSessionEarly} variant="tertiary" />
    </>
  );
};

export default OngoingFocusSessionView;
