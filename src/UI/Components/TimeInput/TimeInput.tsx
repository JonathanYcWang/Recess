import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

import Icon from '@/UI/Components/Icon/Icon';
import EditIconSrc from '@/Assets/Icons/edit.svg?url';
import CheckIconSrc from '@/Assets/Icons/check.svg?url';
import { PHASE_DURATION } from '@/Shared/Constants/Constants';

import styles from './TimeInput.module.css';

const TimeInput = () => {
  const [totalSeconds, setTotalSeconds] = useState(PHASE_DURATION.FOCUS_BLOCK);
  const [isEditing, setIsEditing] = useState(false);

  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const handleHoursChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextHours = Number(event.currentTarget.value);
    if (!Number.isFinite(nextHours)) {
      return;
    }
    setTotalSeconds(nextHours * 3600 + minutes * 60);
  };

  const handleMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextMinutes = Number(event.currentTarget.value);
    if (!Number.isFinite(nextMinutes)) {
      return;
    }
    setTotalSeconds(hours * 3600 + nextMinutes * 60);
  };

  const handleConfirm = () => {
    setIsEditing(false);
  };

  const handleHoursKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      minutesInputRef.current?.focus();
    }
  };

  const handleMinutesKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <motion.div
      className={styles.container}
      layout
      transition={{
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      {!isEditing && (
        <motion.button
          type="button"
          className={styles.displayState}
          onClick={() => setIsEditing(true)}
          aria-label="Edit timer"
          layout
          layoutId="main-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.span layoutId="time-text">
            {String(hours).padStart(2, '0')} Hr. {String(minutes).padStart(2, '0')} Min.
          </motion.span>
          <motion.div
            layoutId="edit-icon"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Icon src={EditIconSrc} alt="" size={20} />
          </motion.div>
        </motion.button>
      )}

      {isEditing && (
        <motion.div
          className={styles.editContent}
          layout
          layoutId="main-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={styles.inputGroup}
            layout
            layoutId="hours-input"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{
              duration: 0.3,
              delay: 0.05,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <input
              ref={hoursInputRef}
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={handleHoursChange}
              onKeyDown={handleHoursKeyDown}
              className={styles.input}
              aria-label="Hours"
            />
            <span className={styles.unitLabel}>Hr.</span>
          </motion.div>

          <motion.div
            className={styles.inputGroup}
            layout
            layoutId="minutes-input"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{
              duration: 0.3,
              delay: 0.1,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <input
              ref={minutesInputRef}
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={handleMinutesChange}
              onKeyDown={handleMinutesKeyDown}
              className={styles.input}
              aria-label="Minutes"
            />
            <span className={styles.unitLabel}>Min.</span>
          </motion.div>

          <motion.button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            aria-label="Confirm time"
            layout
            layoutId="confirm-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: 0.3,
              delay: 0.15,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <Icon src={CheckIconSrc} alt="" size={20} />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TimeInput;
