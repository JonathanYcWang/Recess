import React, { useState } from 'react';
import { Time } from '@internationalized/date';
import { TimeField, DateInput } from './ui/timefield';
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

// Helper function to parse time string (e.g., "11:30 AM") to Time object
const parseTimeString = (timeStr: string): Time => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  return new Time(hour24, minutes);
};

// Helper function to format Time object to string (e.g., "11:30 AM")
const formatTimeToString = (time: Time): string => {
  let hours = time.hour;
  const minutes = time.minute;
  const period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours > 12) {
    hours -= 12;
  } else if (hours === 0) {
    hours = 12;
  }
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const EditTimeRangeOverlay: React.FC<EditTimeRangeOverlayProps> = ({
  timeRange = { start: '11:30 AM', end: '1:30 PM' },
  selectedDays = [false, true, true, true, true, true, false],
  onSave,
  onCancel,
  onDelete,
}) => {
  const [startTime, setStartTime] = useState<Time>(() => parseTimeString(timeRange.start));
  const [endTime, setEndTime] = useState<Time>(() => parseTimeString(timeRange.end));
  const [days, setDays] = useState(selectedDays);

  const toggleDay = (index: number) => {
    setDays((prev) => {
      const newDays = [...prev];
      newDays[index] = !newDays[index];
      return newDays;
    });
  };

  const handleSave = () => {
    onSave(
      {
        start: formatTimeToString(startTime),
        end: formatTimeToString(endTime),
      },
      days
    );
  };

  const handleStartTimeChange = (time: Time | null) => {
    if (time) {
      setStartTime(time);
    }
  };

  const handleEndTimeChange = (time: Time | null) => {
    if (time) {
      setEndTime(time);
    }
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={styles.editTimeRangeOverlay}>
      <div className={styles.contentContainer}>
        <div className={styles.timeInput}>
          <TimeField 
            value={startTime} 
            onChange={handleStartTimeChange}
            aria-label="Start time"
          >
            <DateInput className="min-w-[100px]" />
          </TimeField>
          <p className={styles.dash}>-</p>
          <TimeField 
            value={endTime} 
            onChange={handleEndTimeChange}
            aria-label="End time"
          >
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
