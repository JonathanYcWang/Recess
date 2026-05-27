import RedoIcon from '../../assets/redo.svg?url';
import Icon from '../Icon/Icon';
import styles from './RefreshButton.module.css';

interface RefreshButtonProps {
  onClick?: () => void;
}

const RefreshButton = ({ onClick }: RefreshButtonProps) => {
  return (
    <div className={styles.refreshButton} onClick={onClick}>
      <Icon src={RedoIcon} alt="Refresh" size="md" />
    </div>
  );
};

export default RefreshButton;
