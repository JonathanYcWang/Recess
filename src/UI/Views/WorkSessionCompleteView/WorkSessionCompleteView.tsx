import SecondaryTimerDescription from '@/UI/Components/SecondaryTimerDescription/SecondaryTimerDescription';
import Button from '@/UI/Components/Button/Button';
import styles from './WorkSessionCompleteView.module.css';
interface WorkSessionCompleteViewProps {
  transitionToBeforeWorkSession: () => void;
}

const WorkSessionCompleteView = ({
  transitionToBeforeWorkSession,
}: WorkSessionCompleteViewProps) => {
  return (
    <>
      <SecondaryTimerDescription text="Work Session Complete" />
      <div className={styles.headerContainer}>
        <p className={styles.header}>Congrats!</p>
        <p className={styles.caption}>You've completed your work session for today.</p>
      </div>
      <div className={styles.contentContainer}>
        <Button
          text="Start Next Work Session"
          onClick={transitionToBeforeWorkSession}
          variant="primary"
        />
      </div>
    </>
  );
};

export default WorkSessionCompleteView;
