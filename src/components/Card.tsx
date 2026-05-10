import React from 'react';
import Icon from './Icon/Icon';
import RefreshButton from './RefreshButton/RefreshButton';
import styles from './CardCarousel.module.css';

export interface CardProps {
  title: string;
  description: string;
  footer?: string;
  onClick?: () => void;
  refreshOnClick?: () => void;
}

const Card: React.FC<CardProps> = ({ title, description, footer, onClick, refreshOnClick }) => {
  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card} onClick={onClick}>
        <p className={styles.title}>{title}</p>
        <p className={styles.description}>{description}</p>
        <div className={styles.placeholderImage}>
          <Icon
            src={`https://www.google.com/s2/favicons?domain=${description}&sz=128`}
            alt="Placeholder"
            size={24}
          />
        </div>
        {footer && <p className={styles.footer}>{footer}</p>}
      </div>
      {refreshOnClick && (
        <div className={styles.refreshButtonContainer}>
          <RefreshButton onClick={refreshOnClick} />
        </div>
      )}
    </div>
  );
};

export default Card;
