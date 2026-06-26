import SecondaryTimerDescription from '../../components/SecondaryTimerDescription/SecondaryTimerDescription';
import WorkRhythmActionButton from '../shared/WorkRhythmActionButton';
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
        <WorkRhythmActionButton
          text="Start Next Work Session"
          onClick={transitionToBeforeWorkSession}
          variant="primary"
        />
      </div>
    </>
  );
};

export default WorkSessionCompleteView;
