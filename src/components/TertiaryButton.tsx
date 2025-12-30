import React from 'react';
import styles from './TertiaryButton.module.css';

interface TertiaryButtonProps {
  text: string;
  onClick?: () => void;
}

const TertiaryButton: React.FC<TertiaryButtonProps> = ({ text, onClick }) => {
  return (
    <div 
      className={styles.tertiaryButton} 
      onClick={onClick}
    >
      <p className={styles.text}>
        {text}
      </p>
    </div>
  );
};

export default TertiaryButton;

