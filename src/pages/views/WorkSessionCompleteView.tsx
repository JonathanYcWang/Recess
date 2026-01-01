import React from 'react';
import PrimaryButton from '../../components/PrimaryButton';
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
        <PrimaryButton text="Reset & Start Fresh" onClick={resetTimerState} iconSrc={PlayIcon} />
      </div>
    </>
  );
};

export default WorkSessionCompleteView;
