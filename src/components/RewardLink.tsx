import React from 'react';
import ExternalLinkIcon from '../assets/external-link.svg?url';
import PlaceholderIcon from '../assets/placeholder.svg?url';
import Icon from './Icon';
import styles from './RewardLink.module.css';

interface RewardLinkProps {
  siteName: string;
  status: string;
  onClick?: () => void;
}

const RewardLink: React.FC<RewardLinkProps> = ({ siteName, status, onClick }) => {
  return (
    <div className={styles.rewardLink} onClick={onClick}>
      <Icon src={PlaceholderIcon} alt="External link" size={27.5} />
      <div className={styles.textContainer}>
        <p className={styles.primaryText}>{siteName}</p>
        <div className={styles.secondaryTextContainer}>
          <div className={styles.greenDot} />
          <p className={styles.secondaryText}>{status}</p>
        </div>
            </div>
      <div className={styles.externalLinkIcon}>
        <Icon src={ExternalLinkIcon} alt="External link" size={27.5} />
      </div>
    </div>
  );
};

export default RewardLink;
