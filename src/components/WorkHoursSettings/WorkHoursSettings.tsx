import { useState } from 'react';
import { useSelector } from 'react-redux';
import { PrimitiveAlert, PrimitiveButton, PrimitiveDialog } from '@/primitives';
import WorkWindow from '../WorkWindow/WorkWindow';
import EditTimeRangeOverlay from '../EditTimeRangeOverlay/EditTimeRangeOverlay';
import {
  selectIsWorkStartReminderDisconnected,
  selectWorkStartReminderSchedules,
} from '../../store/selectors/workStartReminderProjectionSelectors';
import type { RootState } from '../../store';
import { createAppWorkStartReminderClient } from '../../store/workStartReminderClient';

import styles from './WorkHoursSettings.module.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_TIME = '09:00 AM';
const DEFAULT_DAYS = [false, true, true, true, true, true, false];

const toReminderErrorMessage = (kind: string): string => {
  switch (kind) {
    case 'invalid-time-input':
      return 'Please enter a valid reminder time.';
    case 'invalid-weekdays':
      return 'Select at least one valid weekday.';
    case 'schedule-not-found':
      return 'That reminder was not found. Refresh and try again.';
    case 'no-planned-occurrence':
      return 'No upcoming reminder is available to skip.';
    case 'stale-revision':
      return 'Reminders changed in another view. Try again.';
    case 'transport-unavailable':
    case 'missing-receiver':
    case 'closed-channel':
    case 'extension-shutdown':
      return 'Work Start Reminder is temporarily unavailable.';
    case 'notification-delivery-failed':
      return 'Reminder was saved, but notification delivery failed.';
    default:
      return 'Could not update reminders. Please try again.';
  }
};

const WorkHoursSettings = () => {
  const entries = useSelector((state: RootState) => selectWorkStartReminderSchedules(state));
  const revision = useSelector((state: RootState) => state.workStartReminderProjection.revision);
  const disconnected = useSelector((state: RootState) =>
    selectIsWorkStartReminderDisconnected(state)
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('09:00 AM');
  const [editDays, setEditDays] = useState([false, true, true, true, true, true, false]);
  const [commandError, setCommandError] = useState<string>('');

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

  const handleToggle = async (id: string) => {
    if (!client) {
      setCommandError('Work Start Reminder is unavailable in this context.');
      return;
    }
    const result = await client.toggleScheduleEnabled(id, {
      expectedRevision: revision ?? undefined,
    });
    setCommandError(result.ok ? '' : toReminderErrorMessage(result.error.kind));
  };

  const formatDays = (selectedDays: boolean[]) => {
    const selectedDayNames = selectedDays
      .map((selected, index) => (selected ? DAY_LABELS[index] : null))
      .filter(Boolean);
    return selectedDayNames.length > 0 ? selectedDayNames.join(', ') : 'No days selected';
  };

  const handleSave = async (time: string, days: boolean[]) => {
    if (!client) {
      setCommandError('Work Start Reminder is unavailable in this context.');
      return;
    }
    const result = editingId
      ? await client.updateSchedule(
          editingId,
          { time, days },
          { expectedRevision: revision ?? undefined }
        )
      : await client.addSchedule({ time, days }, { expectedRevision: revision ?? undefined });
    if (!result.ok) {
      setCommandError(toReminderErrorMessage(result.error.kind));
      return;
    }
    setCommandError('');
    closeDialog();
  };

  const handleDelete = async () => {
    if (!client || !editingId) {
      if (!client) {
        setCommandError('Work Start Reminder is unavailable in this context.');
      }
      return;
    }
    const result = await client.deleteSchedule(editingId, {
      expectedRevision: revision ?? undefined,
    });
    if (!result.ok) {
      setCommandError(toReminderErrorMessage(result.error.kind));
      return;
    }
    setCommandError('');
    closeDialog();
  };

  const handleSkipNext = async () => {
    if (!client) {
      setCommandError('Work Start Reminder is unavailable in this context.');
      return;
    }
    const result = await client.skipNext({ expectedRevision: revision ?? undefined });
    setCommandError(result.ok ? '' : toReminderErrorMessage(result.error.kind));
  };

  return (
    <div className={styles.workHoursSettings}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Set Work Start Reminders</p>
        <p className={styles.caption}>Pick a time and days to get a reminder to start work.</p>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.actionsRow}>
          <PrimitiveButton onClick={() => openDialog()} disabled={disconnected}>
            Add
          </PrimitiveButton>
          <PrimitiveButton
            variant="secondary"
            className={styles.skipButton}
            onClick={() => void handleSkipNext()}
            disabled={disconnected || entries.length === 0}
          >
            Skip next
          </PrimitiveButton>
        </div>
        {disconnected && (
          <PrimitiveAlert variant="warning" role="status">
            Work Start Reminder is read-only while disconnected from the background runtime.
          </PrimitiveAlert>
        )}
        {commandError && <PrimitiveAlert variant="error">{commandError}</PrimitiveAlert>}
        {entries.map((entry) => (
          <WorkWindow
            key={entry.id}
            timeRange={entry.time}
            days={formatDays(entry.days)}
            enabled={entry.enabled}
            onEdit={() => openDialog(entry.id)}
            onToggle={() => void handleToggle(entry.id)}
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
