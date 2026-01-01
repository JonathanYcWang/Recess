import React from 'react';
import styles from './SecondaryTimerDescription.module.css';

interface SecondaryTimerDescriptionProps {
  text: string;
  onClick?: () => void;
}

const SecondaryTimerDescription: React.FC<SecondaryTimerDescriptionProps> = ({ text, onClick }) => {
  return (
    <div 
      className={`${styles.secondaryTimerDescription} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <div className={styles.dot} />
      <p className={styles.text}>{text}</p>
    </div>
  );
};

export default SecondaryTimerDescription;
