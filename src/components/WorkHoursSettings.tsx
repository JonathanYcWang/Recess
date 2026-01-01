import React, { useState } from 'react';
import { Dialog } from '@mui/material';
import PrimaryButton from './PrimaryButton';
import WorkWindow from './WorkWindow';
import EditTimeRangeOverlay from './EditTimeRangeOverlay';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addWorkHoursEntry,
  updateWorkHoursEntry,
  deleteWorkHoursEntry,
  toggleWorkHoursEntry,
} from '../store/slices/workHoursSlice';
import styles from './WorkHoursSettings.module.css';

const WorkHoursSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.workHours.entries);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openOverlay = (id: string | null = null) => {
    setEditingId(id);
    setOverlayOpen(true);
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    setEditingId(null);
  };

  const formatDays = (selectedDays: boolean[]) => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDayNames = selectedDays
      .map((selected, index) => (selected ? dayLabels[index] : null))
      .filter(Boolean) as string[];
    return selectedDayNames.length > 0 ? selectedDayNames.join(', ') : 'No days selected';
  };

  const handleSave = (timeRange: { start: string; end: string }, selectedDays: boolean[]) => {
    if (editingId) {
      dispatch(
        updateWorkHoursEntry({
          id: editingId,
          startTime: timeRange.start,
          endTime: timeRange.end,
          days: selectedDays,
        })
      );
    } else {
      dispatch(
        addWorkHoursEntry({
          startTime: timeRange.start,
          endTime: timeRange.end,
          days: selectedDays,
        })
      );
    }
    closeOverlay();
  };

  const handleDelete = () => {
    if (editingId) {
      dispatch(deleteWorkHoursEntry(editingId));
      closeOverlay();
    }
  };

  const editingEntry = editingId ? entries.find((e) => e.id === editingId) : null;

  return (
    <div className={styles.workHoursSettings}>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Set Work Hours</p>
        <p className={styles.caption}>Add the time ranges to focus which works best for you.</p>
      </div>
      <div className={styles.contentContainer}>
        <PrimaryButton text="Add" onClick={() => openOverlay()} />
        {entries.map((entry) => (
          <WorkWindow
            key={entry.id}
            timeRange={`${entry.startTime} - ${entry.endTime}`}
            days={formatDays(entry.days)}
            enabled={entry.enabled}
            onToggle={() => dispatch(toggleWorkHoursEntry(entry.id))}
            onEdit={() => openOverlay(entry.id)}
          />
        ))}
      </div>
      <Dialog
        open={overlayOpen}
        onClose={closeOverlay}
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
          timeRange={{
            start: editingEntry?.startTime || '11:30 AM',
            end: editingEntry?.endTime || '1:30 PM',
          }}
          selectedDays={editingEntry?.days}
          onSave={handleSave}
          onCancel={closeOverlay}
          onDelete={editingId ? handleDelete : undefined}
        />
      </Dialog>
    </div>
  );
};

export default WorkHoursSettings;
