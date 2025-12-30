import React from 'react';
import Icon from './Icon';
import styles from './SecondaryButton.module.css';

interface SecondaryButtonProps {
  text: string;
  onClick?: () => void;
  iconSrc?: string;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ 
  text, 
  onClick,
  iconSrc
}) => {
  return (
    <div 
      className={styles.secondaryButton} 
      onClick={onClick}
    >
      {iconSrc && (
        <Icon 
          src={iconSrc} 
          alt="Icon" 
          size={20}
        />
      )}
      <p className={styles.text}>
        {text}
      </p>
    </div>
  );
};

export default SecondaryButton;

