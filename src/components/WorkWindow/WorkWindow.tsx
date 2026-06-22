import Toggle from '../Toggle/Toggle';
import { toPressableDivProps } from '@/utils/pressable';
import styles from './WorkWindow.module.css';

interface WorkWindowProps {
  timeRange: string;
  days: string;
  enabled: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}

const WorkWindow = ({ timeRange, days, enabled, onToggle, onEdit }: WorkWindowProps) => {
  const handleToggle = () => {
    onToggle?.();
  };

  return (
    <div className={styles.workWindow} {...(onEdit ? toPressableDivProps(onEdit) : {})}>
      <p className={styles.timeRange}>{timeRange}</p>
      <p className={styles.days}>{days}</p>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- isolate toggle clicks from row edit handler */}
      <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
        <Toggle isOn={enabled} onToggle={handleToggle} />
      </div>
    </div>
  );
};

export default WorkWindow;
