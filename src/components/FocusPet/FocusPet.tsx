import { PrimitiveCard } from '@/primitives';
import styles from './FocusPet.module.css';

interface FocusPetProps {
  petName: string;
  imgSrc: string;
  imgAlt: string;
}

const FocusPet = ({ petName, imgSrc, imgAlt }: FocusPetProps) => {
  return (
    <PrimitiveCard className={styles.focusPet} title={`${petName} in Deep Work`}>
      <p className={styles.description}>Heads down and grinding alongside you.</p>
      <div className={styles.petStage}>
        <img className={styles.petImage} src={imgSrc} alt={imgAlt} />
      </div>
    </PrimitiveCard>
  );
};

export default FocusPet;
