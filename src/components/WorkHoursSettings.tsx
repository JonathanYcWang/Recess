import React, { useState } from 'react';
import { Dialog } from '@mui/material';
import PrimaryButton from './PrimaryButton';
import WorkWindow from './WorkWindow';
import EditTimeRangeOverlay from './EditTimeRangeOverlay';
import styles from './WorkHoursSettings.module.css';

interface WorkHoursEntry {
  id: string;
  timeRange: string;
  days: string;
  enabled: boolean;
  startTime?: string;
  endTime?: string;
  selectedDays?: boolean[];
}

const WorkHoursSettings: React.FC = () => {
  const [entries, setEntries] = useState<WorkHoursEntry[]>([]);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkHoursEntry | null>(null);

  const toggleEntry = (id: string) => {
    setEntries(
      entries.map((entry) => (entry.id === id ? { ...entry, enabled: !entry.enabled } : entry))
    );
  };

  const openOverlay = (entry: WorkHoursEntry | null = null) => {
    setEditingEntry(entry);
    setOverlayOpen(true);
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    setEditingEntry(null);
  };

  const formatDays = (selectedDays: boolean[]) => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDayNames = selectedDays
      .map((selected, index) => (selected ? dayLabels[index] : null))
      .filter(Boolean) as string[];
    return selectedDayNames.length > 0 ? selectedDayNames.join(', ') : 'No days selected';
  };

  const handleSave = (timeRange: { start: string; end: string }, selectedDays: boolean[]) => {
    const newEntry: Partial<WorkHoursEntry> = {
      timeRange: `${timeRange.start} - ${timeRange.end}`,
      days: formatDays(selectedDays),
      startTime: timeRange.start,
      endTime: timeRange.end,
      selectedDays,
    };

    if (editingEntry) {
      setEntries(
        entries.map((entry) => (entry.id === editingEntry.id ? { ...entry, ...newEntry } : entry))
      );
    } else {
      setEntries([
        ...entries,
        { ...newEntry, id: Date.now().toString(), enabled: true } as WorkHoursEntry,
      ]);
    }
    closeOverlay();
  };

  const handleDelete = () => {
    if (editingEntry) {
      setEntries(entries.filter((entry) => entry.id !== editingEntry.id));
      closeOverlay();
    }
  };

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
            timeRange={entry.timeRange}
            days={entry.days}
            enabled={entry.enabled}
            onToggle={() => toggleEntry(entry.id)}
            onEdit={() => openOverlay(entry)}
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
          selectedDays={editingEntry?.selectedDays}
          onSave={handleSave}
          onCancel={closeOverlay}
          onDelete={editingEntry ? handleDelete : undefined}
        />
      </Dialog>
    </div>
  );
};

export default WorkHoursSettings;

