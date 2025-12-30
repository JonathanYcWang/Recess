import React from 'react';
import styles from './SecondaryTimerDescription.module.css';

interface SecondaryTimerDescriptionProps {
  text: string;
}

const SecondaryTimerDescription: React.FC<SecondaryTimerDescriptionProps> = ({ text }) => {
  return (
    <div className={styles.secondaryTimerDescription}>
      <div className={styles.dot} />
      <p className={styles.text}>{text}</p>
    </div>
  );
};

export default SecondaryTimerDescription;
