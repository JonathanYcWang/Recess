import { useState } from 'react';
import FocusTimer from '@/UI/Components/FocusTimer/FocusTimer';
import PausedTimer from '@/UI/Components/PausedTimer/PausedTimer';
import Button from '@/UI/Components/Button/Button';
import PauseIcon from '../../../Assets/Icons/pause.svg?url';
import PlayIcon from '../../../Assets/Icons/play.svg?url';
import styles from './OngoingFocusSessionView.module.css';

const TOTAL_SESSIONS = 5;
const CURRENT_SESSION = 2;

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

const CoffeeIcon = () => (
  <svg className={styles.statusIcon} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" />
    <path d="M16 10h1a3 3 0 0 1 0 6h-1" />
    <path d="M6 2v3" />
    <path d="M10 2v3" />
    <path d="M14 2v3" />
  </svg>
);

const formatDurationShort = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
};

interface OngoingFocusSessionViewProps {
  isPaused: boolean;
  currentTimer: number;
  currentRemaining: number;
  totalRemaining: number;
  pauseSession: () => void;
  resumeSession: () => void;
  endSessionEarly: () => void;
}

const OngoingFocusSessionView = ({
  isPaused,
  currentTimer,
  currentRemaining,
  totalRemaining,
  pauseSession,
  resumeSession,
  endSessionEarly,
}: OngoingFocusSessionViewProps) => {
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const nextRecessMinutes = Math.max(0, Math.ceil(currentRemaining / 60));

  const handleConfirmPause = () => {
    setShowPauseConfirm(false);
    pauseSession();
  };

  return (
    <>
      <div className={styles.timerHeader}>
        <div className={styles.statusPill}>
          <CoffeeIcon />
          Deep Work · Session {CURRENT_SESSION} of {TOTAL_SESSIONS}
        </div>
      </div>

      {isPaused ? (
        <PausedTimer />
      ) : (
        <FocusTimer
          timer={currentTimer}
          remainingTimer={currentRemaining}
          label="Remaining"
          description="Active Focus Session"
        />
      )}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.iconBox}>
            <ClockIcon />
          </div>
          <div className={styles.summaryCopy}>
            <p className={styles.summaryLabel}>Total left today</p>
            <p className={styles.summaryValue}>{formatDurationShort(totalRemaining)}</p>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.rewardCard}`}>
          <div className={`${styles.iconBox} ${styles.giftIconBox}`}>
            <GiftIcon />
          </div>
          <div className={styles.summaryCopy}>
            <p className={styles.summaryLabel}>Next Recess in {nextRecessMinutes}m</p>
            <p className={styles.summaryValue}>5-min coffee break</p>
          </div>
        </div>
      </div>

      {isPaused ? (
        <div className={styles.contentContainer}>
          <Button
            text="Resume Focus Session"
            onClick={resumeSession}
            iconSrc={PlayIcon}
            variant="primary"
          />
          <Button text="End Focus Session Early" onClick={endSessionEarly} variant="tertiary" />
        </div>
      ) : (
        <Button
          text="Pause Focus Session"
          onClick={() => setShowPauseConfirm(true)}
          iconSrc={PauseIcon}
          variant="secondary"
        />
      )}

      {showPauseConfirm && (
        <div className={styles.dialogBackdrop} role="presentation">
          <div className={styles.confirmDialog} role="dialog" aria-modal="true">
            <div className={styles.confirmIcon} aria-hidden="true">
              <CoffeeIcon />
            </div>
            <h3 className={styles.confirmTitle}>Take a break?</h3>
            <p className={styles.confirmCopy}>
              Are you sure you want to pause your deep work session?
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={() => setShowPauseConfirm(false)}
              >
                No
              </button>
              <button className={styles.confirmButton} type="button" onClick={handleConfirmPause}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OngoingFocusSessionView;
