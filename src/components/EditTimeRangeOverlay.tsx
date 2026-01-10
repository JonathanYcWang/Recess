import React, { useState } from 'react';
import { Time } from '@internationalized/date';
import { TimeField, DateInput } from './ui/timefield';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TertiaryButton from './TertiaryButton';
import styles from './EditTimeRangeOverlay.module.css';

interface EditTimeRangeOverlayProps {
  time?: string;
  selectedDays?: boolean[];
  onSave: (time: string, selectedDays: boolean[]) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

// Helper function to parse time string (e.g., "09:00 AM") to Time object
const parseTimeString = (timeStr: string): Time => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) hour24 = hours + 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  return new Time(hour24, minutes);
};
const formatTimeToString = (time: Time): string => {
  let hours = time.hour;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${time.minute.toString().padStart(2, '0')} ${period}`;
};

const EditTimeRangeOverlay: React.FC<EditTimeRangeOverlayProps> = ({
  time = '09:00 AM',
  selectedDays = [false, true, true, true, true, true, false],
  onSave,
  onCancel,
  onDelete,
}) => {
  const [reminderTime, setReminderTime] = useState<Time>(() => parseTimeString(time));
  const [days, setDays] = useState(selectedDays);

  const toggleDay = (index: number) => {
    setDays((prev) => prev.map((day, i) => (i === index ? !day : day)));
  };

  const handleSave = () => {
    onSave(formatTimeToString(reminderTime), days);
  };
  const handleTimeChange = (time: Time | null) => {
    if (time) setReminderTime(time);
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={styles.editTimeRangeOverlay}>
      <div className={styles.contentContainer}>
        <div className={styles.timeInput}>
          <TimeField value={reminderTime} onChange={handleTimeChange} aria-label="Reminder time">
            <DateInput className="min-w-[100px]" />
          </TimeField>
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
            <PrimaryButton text="Save" onClick={handleSave} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTimeRangeOverlay;
