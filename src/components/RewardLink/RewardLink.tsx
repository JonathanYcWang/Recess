import ExternalLinkIcon from '../../assets/external-link.svg?url';
import PlaceholderIcon from '../../assets/placeholder.svg?url';
import Icon from '../Icon/Icon';
import { toPressableDivProps } from '@/utils/pressable';
import styles from './RewardLink.module.css';

interface RewardLinkProps {
  siteName: string;
  status: string;
  siteUrl?: string;
  onClick?: () => void;
}

const RewardLink = ({ siteName, status, siteUrl, onClick }: RewardLinkProps) => {
  const handleClick = () => {
    if (siteUrl) {
      window.open(`https://${siteUrl}`, '_blank');
    }
    onClick?.();
  };

  return (
    <div className={styles.rewardLink} {...toPressableDivProps(handleClick)}>
      <Icon src={PlaceholderIcon} alt="External link" size="lg" />
      <div className={styles.textContainer}>
        <p className={styles.primaryText}>{siteName}</p>
        <div className={styles.secondaryTextContainer}>
          <div className={styles.greenDot} />
          <p className={styles.secondaryText}>{status}</p>
        </div>
      </div>
      <div className={styles.externalLinkIcon}>
        <Icon src={ExternalLinkIcon} alt="External link" size="lg" />
      </div>
    </div>
  );
};

export default RewardLink;
