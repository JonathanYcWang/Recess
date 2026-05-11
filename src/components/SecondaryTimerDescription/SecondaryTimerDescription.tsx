import styles from './SecondaryTimerDescription.module.css';

interface SecondaryTimerDescriptionProps {
  text: string;
  onClick?: () => void;
}

const SecondaryTimerDescription = ({ text, onClick }: SecondaryTimerDescriptionProps) => {
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
