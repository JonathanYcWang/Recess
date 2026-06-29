import RedoIcon from '../../../Assets/Icons/redo.svg?url';
import Icon from '../Icon/Icon';
import { toPressableDivProps } from '@/Shared/Utils/pressable';
import styles from './RefreshButton.module.css';

interface RefreshButtonProps {
  onClick?: () => void;
}

const RefreshButton = ({ onClick }: RefreshButtonProps) => {
  return (
    <div className={styles.refreshButton} {...(onClick ? toPressableDivProps(onClick) : {})}>
      <Icon src={RedoIcon} alt="Refresh" size="md" />
    </div>
  );
};

export default RefreshButton;
