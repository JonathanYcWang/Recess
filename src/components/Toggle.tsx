import React from 'react';
import styles from './Toggle.module.css';

interface ToggleProps {
  isOn: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ isOn }) => {
  if (isOn) {
    return (
      <div 
        className={`${styles.toggle} ${styles.toggleOn}`} 
      >
        <div className={styles.backgroundShadow} />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.toggle} ${styles.toggleOff}`} 
    >
      <div className={styles.backgroundShadow} />
    </div>
  );
};

export default Toggle;

