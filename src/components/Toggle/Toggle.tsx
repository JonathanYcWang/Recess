import { toPressableDivProps } from '@/Shared/Utils/pressable';
import styles from './Toggle.module.css';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

const Toggle = ({ isOn, onToggle }: ToggleProps) => {
  const toggleClasses = `${styles.toggle} ${isOn ? styles.toggleOn : styles.toggleOff}`;

  return (
    <div className={toggleClasses} {...toPressableDivProps(onToggle)}>
      <div className={styles.backgroundShadow} />
    </div>
  );
};

export default Toggle;
