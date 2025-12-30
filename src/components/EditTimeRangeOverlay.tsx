import React, { useState } from 'react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TertiaryButton from './TertiaryButton';
import styles from './EditTimeRangeOverlay.module.css';

interface EditTimeRangeOverlayProps {
  timeRange?: { start: string; end: string };
  selectedDays?: boolean[];
  onSave: (timeRange: { start: string; end: string }, selectedDays: boolean[]) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const EditTimeRangeOverlay: React.FC<EditTimeRangeOverlayProps> = ({
  timeRange = { start: '11:30 AM', end: '1:30 PM' },
  selectedDays = [false, true, true, true, true, true, false],
  onSave,
  onCancel,
  onDelete,
}) => {
  const [startTime] = useState(timeRange.start);
  const [endTime] = useState(timeRange.end);
  const [days, setDays] = useState(selectedDays);

  const toggleDay = (index: number) => {
    setDays((prev) => {
      const newDays = [...prev];
      newDays[index] = !newDays[index];
      return newDays;
    });
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={styles.editTimeRangeOverlay}>
      <div className={styles.contentContainer}>
        <div className={styles.timeInput}>
          <p className={styles.timeText}>{startTime}</p>
          <p className={styles.dash}>-</p>
          <p className={styles.timeText}>{endTime}</p>
        </div>
        <div className={styles.repeatContainer}>
          <p className={styles.repeatLabel}>Repeat:</p>
          <div className={styles.daySelectionContainer}>
            {dayLabels.map((day, index) => (
              <button
                key={index}
                className={`${styles.dayButton} ${
                  days[index] ? styles.dayButtonSelected : styles.dayButtonUnselected
                }`}
                onClick={() => toggleDay(index)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.actionsContainer}>
          {onDelete && <TertiaryButton text="Delete" onClick={onDelete} />}
          <div className={styles.saveCancelContainer}>
            <SecondaryButton text="Cancel" onClick={onCancel} />
            <PrimaryButton
              text="Save"
              onClick={() => onSave({ start: startTime, end: endTime }, days)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTimeRangeOverlay;
