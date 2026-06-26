import { Switch } from 'react-aria-components';

import interaction from '../shared/interaction.module.css';
import styles from './Switch.module.css';

export interface PrimitiveSwitchProps {
  label: string;
  isSelected?: boolean;
  defaultSelected?: boolean;
  isDisabled?: boolean;
  onChange?: (isSelected: boolean) => void;
  id?: string;
  hideLabel?: boolean;
  className?: string;
}

export const PrimitiveSwitch = ({
  label,
  isSelected,
  defaultSelected,
  isDisabled,
  onChange,
  id,
  hideLabel = false,
  className = '',
}: PrimitiveSwitchProps) => (
  <Switch
    id={id}
    isSelected={isSelected}
    defaultSelected={defaultSelected}
    isDisabled={isDisabled}
    onChange={onChange}
    className={`${styles.switch} ${interaction.focusVisible} ${className}`}
  >
    <span className={styles.track} aria-hidden="true">
      <span className={styles.thumb} />
    </span>
    <span className={`${styles.label} ${hideLabel ? styles.labelHidden : ''}`}>{label}</span>
  </Switch>
);
