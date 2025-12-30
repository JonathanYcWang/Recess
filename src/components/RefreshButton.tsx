import React from 'react';
import RedoIcon from '../assets/redo.svg?url';
import Icon from './Icon';
import styles from './RefreshButton.module.css';

interface RefreshButtonProps {
  onClick?: () => void;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick }) => {
  return (
    <div 
      className={styles.refreshButton} 
      onClick={onClick}
    >
      <Icon 
        src={RedoIcon} 
        alt="Refresh" 
        size={20}
      />
    </div>
  );
};

export default RefreshButton;

