import React from 'react';
import Toggle from './Toggle';
import styles from './WorkWindow.module.css';

interface WorkWindowProps {
  timeRange: string;
  days: string;
  enabled: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}

const WorkWindow: React.FC<WorkWindowProps> = ({ timeRange, days, enabled, onToggle, onEdit }) => {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.();
  };

  return (
    <div className={styles.workWindow} onClick={onEdit}>
      <p className={styles.timeRange}>{timeRange}</p>
      <p className={styles.days}>{days}</p>
      <div onClick={handleToggleClick}>
        <Toggle isOn={enabled} />
      </div>
    </div>
  );
};

export default WorkWindow;
