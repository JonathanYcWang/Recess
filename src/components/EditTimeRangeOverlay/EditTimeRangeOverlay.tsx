import { useState } from 'react';
import { Time } from '@internationalized/date';
import { PrimitiveButton } from '@/primitives';
import { formatDisplayTimeString, parseDisplayTimeString } from '@/modules/work-start-reminder';
import { TimeField } from '../TimeField/TimeField';
import styles from './EditTimeRangeOverlay.module.css';

interface EditTimeRangeOverlayProps {
  time?: string;
  selectedDays?: boolean[];
  onSave: (time: string, selectedDays: boolean[]) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const defaultTime = new Time(9, 0);

const parseTimeString = (timeStr: string): Time => {
  const parsed = parseDisplayTimeString(timeStr);
  if (!parsed.ok) {
    return defaultTime;
  }
  return new Time(parsed.value.hour, parsed.value.minute);
};

const formatTimeToString = (time: Time): string => {
  return formatDisplayTimeString({ hour: time.hour, minute: time.minute });
};

const EditTimeRangeOverlay = ({
  time = '09:00 AM',
  selectedDays = [false, true, true, true, true, true, false],
  onSave,
  onCancel,
  onDelete,
}: EditTimeRangeOverlayProps) => {
  const [reminderTime, setReminderTime] = useState(() => parseTimeString(time));
  const [days, setDays] = useState(selectedDays);

  const toggleDay = (index: number) => {
    setDays((prev) => prev.map((day, i) => (i === index ? !day : day)));
  };

  const handleSave = () => {
    onSave(formatTimeToString(reminderTime), days);
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={styles.editTimeRangeOverlay}>
      <div className={styles.contentContainer}>
        <div className={styles.timeInput}>
          <TimeField
            aria-label="Time"
            value={reminderTime}
            onChange={(value) => value && setReminderTime(value)}
            hourCycle={12}
          />
        </div>
        <div className={styles.repeatContainer}>
          <p className={styles.repeatLabel}>Repeat:</p>
          <div className={styles.daySelectionContainer}>
            {dayLabels.map((day, index) => (
              <PrimitiveButton
                key={index}
                variant={days[index] ? 'primary' : 'secondary'}
                className={`${styles.dayButton} ${
                  days[index] ? styles.dayButtonSelected : styles.dayButtonUnselected
                }`}
                type="button"
                aria-pressed={days[index]}
                onClick={() => toggleDay(index)}
              >
                {day}
              </PrimitiveButton>
            ))}
          </div>
        </div>
        <div className={styles.actionsContainer}>
          {onDelete && (
            <PrimitiveButton variant="ghost" onClick={onDelete}>
              Delete
            </PrimitiveButton>
          )}
          <div className={styles.saveCancelContainer}>
            <PrimitiveButton variant="secondary" onClick={onCancel}>
              Cancel
            </PrimitiveButton>
            <PrimitiveButton onClick={handleSave}>Save</PrimitiveButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTimeRangeOverlay;
