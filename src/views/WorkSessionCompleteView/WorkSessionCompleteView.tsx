import React from 'react';
import Button from '../../components/Button/Button';
import PlayIcon from '../../assets/play.svg?url';
import styles from '../MainPage.module.css';

interface WorkSessionCompleteViewProps {
  resetTimerState: () => void;
}

const WorkSessionCompleteView: React.FC<WorkSessionCompleteViewProps> = ({ resetTimerState }) => {
  return (
    <>
      <div className={styles.headerContainer}>
        <p className={styles.header}>Congrats!</p>
        <p className={styles.caption}>You've completed your work session for today.</p>
      </div>
      <div className={styles.contentContainer}>
        <Button
          text="Reset & Start Fresh"
          onClick={resetTimerState}
          iconSrc={PlayIcon}
          variant="primary"
        />
      </div>
    </>
  );
};

export default WorkSessionCompleteView;
