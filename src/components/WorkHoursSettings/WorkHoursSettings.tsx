import { useState } from 'react';
import { useSelector } from 'react-redux';
import { PrimitiveDialog } from '@/primitives';
import Button from '../Button/Button';
import WorkWindow from '../WorkWindow/WorkWindow';
import EditTimeRangeOverlay from '../EditTimeRangeOverlay/EditTimeRangeOverlay';
import { selectWorkStartReminderSchedules } from '../../store/selectors/workStartReminderProjectionSelectors';
import type { RootState } from '../../store';
import { createAppWorkStartReminderClient } from '../../store/workStartReminderClient';

import styles from './WorkHoursSettings.module.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_TIME = '09:00 AM';
const DEFAULT_DAYS = [false, true, true, true, true, true, false];

const WorkHoursSettings = () => {
  const entries = useSelector((state: RootState) => selectWorkStartReminderSchedules(state));
  const revision = useSelector((state: RootState) => state.workStartReminderProjection.revision);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('09:00 AM');
  const [editDays, setEditDays] = useState([false, true, true, true, true, true, false]);

  const client = createAppWorkStartReminderClient();

  const openDialog = (id: string | null = null) => {
    setEditingId(id);
    const entry = id ? entries.find((e) => e.id === id) : null;
    setEditTime(entry?.time || DEFAULT_TIME);
    setEditDays(entry?.days || DEFAULT_DAYS);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleToggle = (id: string) => {
    if (!client) {
      return;
    }
    void client.toggleScheduleEnabled(id, { expectedRevision: revision ?? undefined });
  };

  const formatDays = (selectedDays: boolean[]) => {
    const selectedDayNames = selectedDays
      .map((selected, index) => (selected ? DAY_LABELS[index] : null))
      .filter(Boolean);
    return selectedDayNames.length > 0 ? selectedDayNames.join(', ') : 'No days selected';
  };

  const handleSave = (time: string, days: boolean[]) => {
    if (!client) {
      return;
    }
    if (editingId) {
      void client.updateSchedule(
        editingId,
        { time, days },
        { expectedRevision: revision ?? undefined }
      );
    } else {
      void client.addSchedule({ time, days }, { expectedRevision: revision ?? undefined });
    }
    closeDialog();
  };

  const handleDelete = () => {
    if (!client || !editingId) {
      return;
    }
    void client.deleteSchedule(editingId, { expectedRevision: revision ?? undefined });
    closeDialog();
  };

  return (
    <div className={styles.workHoursSettings}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Set Work Start Reminders</p>
        <p className={styles.caption}>Pick a time and days to get a reminder to start work.</p>
      </div>
      <div className={styles.contentContainer}>
        <Button text="Add" onClick={() => openDialog()} variant="primary" />
        {entries.map((entry) => (
          <WorkWindow
            key={entry.id}
            timeRange={entry.time}
            days={formatDays(entry.days)}
            enabled={entry.enabled}
            onEdit={() => openDialog(entry.id)}
            onToggle={() => handleToggle(entry.id)}
          />
        ))}
      </div>
      <PrimitiveDialog
        isOpen={dialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) closeDialog();
        }}
        variant="unframed"
        aria-label="Edit work start reminder"
      >
        <EditTimeRangeOverlay
          time={editTime}
          selectedDays={editDays}
          onSave={handleSave}
          onCancel={closeDialog}
          onDelete={editingId ? handleDelete : undefined}
        />
      </PrimitiveDialog>
    </div>
  );
};

export default WorkHoursSettings;
