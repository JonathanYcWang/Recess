import styles from './FocusPet.module.css';

interface FocusPetProps {
  petName: string;
  imgSrc: string;
}

const FocusPet = ({ petName, imgSrc }: FocusPetProps) => {
  return (
    <section className={styles.focusPet} aria-label={`${petName} focus companion`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{petName} in Deep Work</h3>
      </div>
      <p className={styles.description}>Heads down and grinding alongside you.</p>
      <div className={styles.petStage}>
        <img className={styles.petImage} src={imgSrc} />
      </div>
    </section>
  );
};

export default FocusPet;
