import React, { useState } from 'react';
import { Dialog } from '@mui/material';
import PrimaryButton from './PrimaryButton';
import WorkWindow from './WorkWindow';
import EditTimeRangeOverlay from './EditTimeRangeOverlay';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectWorkHoursEntries } from '../store/selectors';
import {
  addWorkHoursEntry,
  updateWorkHoursEntry,
  deleteWorkHoursEntry,
  toggleWorkHoursEntry,
} from '../store/slices/workHoursSlice';

import styles from './WorkHoursSettings.module.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_TIME = '09:00 AM';
const DEFAULT_DAYS = [false, true, true, true, true, true, false];

const WorkHoursSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectWorkHoursEntries);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('09:00 AM');
  const [editDays, setEditDays] = useState([false, true, true, true, true, true, false]);

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
    dispatch(toggleWorkHoursEntry(id));
  };

  const formatDays = (selectedDays: boolean[]) => {
    const selectedDayNames = selectedDays
      .map((selected, index) => (selected ? DAY_LABELS[index] : null))
      .filter(Boolean);
    return selectedDayNames.length > 0 ? selectedDayNames.join(', ') : 'No days selected';
  };

  const handleSave = (time: string, days: boolean[]) => {
    if (editingId) {
      dispatch(updateWorkHoursEntry({ id: editingId, time, days }));
    } else {
      dispatch(addWorkHoursEntry({ time, days }));
    }
    closeDialog();
  };

  const handleDelete = () => {
    if (editingId) {
      dispatch(deleteWorkHoursEntry(editingId));
      closeDialog();
    }
  };

  return (
    <div className={styles.workHoursSettings}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Set Work Start Reminders</p>
        <p className={styles.caption}>Pick a time and days to get a reminder to start work.</p>
      </div>
      <div className={styles.contentContainer}>
        <PrimaryButton text="Add" onClick={() => openDialog()} />
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
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              maxWidth: '400px',
              width: '100%',
            },
          },
        }}
      >
        <EditTimeRangeOverlay
          time={editTime}
          selectedDays={editDays}
          onSave={handleSave}
          onCancel={closeDialog}
          onDelete={editingId ? handleDelete : undefined}
        />
      </Dialog>
    </div>
  );
};

export default WorkHoursSettings;
