import React from 'react';
import Icon from './Icon';
import styles from './PrimaryButton.module.css';

interface PrimaryButtonProps {
  text: string;
  onClick?: () => void;
  iconSrc?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ text, onClick, iconSrc }) => {
  return (
    <div
      className={styles.primaryButton}
      onClick={onClick}
    >
      {iconSrc && <Icon src={iconSrc} alt="Icon" size={20} />}
      <p className={styles.text}>{text}</p>
    </div>
  );
};

export default PrimaryButton;
