import React from 'react';
import styles from './CountdownTimer.module.css';

interface CountdownTimerProps {
  time: string;
  label: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ time, label }) => {
  return (
    <div className={styles.countdownTimer}>
      <div className={styles.innerBorderShadow}>
        <div className={styles.contentContainer}>
          <p className={styles.timeText}>{time}</p>
          <p className={styles.labelText}>{label}</p>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
