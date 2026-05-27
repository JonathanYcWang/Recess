import type { MouseEvent } from 'react';
import Toggle from '../Toggle/Toggle';
import styles from './WorkWindow.module.css';

interface WorkWindowProps {
  timeRange: string;
  days: string;
  enabled: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}

const WorkWindow = ({ timeRange, days, enabled, onToggle, onEdit }: WorkWindowProps) => {
  const handleContainerClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggle?.();
  };

  const handleToggle = () => {
    onToggle?.();
  };

  return (
    <div className={styles.workWindow} onClick={onEdit}>
      <p className={styles.timeRange}>{timeRange}</p>
      <p className={styles.days}>{days}</p>
      <div onClick={handleContainerClick}>
        <Toggle isOn={enabled} onToggle={handleToggle} />
      </div>
    </div>
  );
};

export default WorkWindow;
