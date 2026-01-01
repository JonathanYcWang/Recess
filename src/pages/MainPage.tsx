import React from 'react';
import NavBar from '../components/NavBar';
import { useTimer } from '../store/hooks/useTimer';
import { useAppSelector } from '../store/hooks';
import WelcomeView from './views/WelcomeView';
import BeforeSessionView from './views/BeforeSessionView';
import DuringSessionView from './views/DuringSessionView';
import PausedView from './views/PausedView';
import RewardSelectionView from './views/RewardSelectionView';
import BreakView from './views/BreakView';
import BackToItView from './views/BackToItView';
import SessionCompleteView from './views/SessionCompleteView';
import styles from './MainPage.module.css';

const MainPage: React.FC = () => {
  const hasOnboarded = useAppSelector((state) => state.routing.hasOnboarded);
  const {
    timerState,
    startFocusSession,
    pauseSession,
    resumeSession,
    selectReward,
    handleReroll,
    endSessionEarly,
    resetTimerState,
    rewards,
    formatTime,
    isLoaded,
  } = useTimer();

  const {
    sessionState,
    focusSessionDurationRemaining,
    breakSessionDurationRemaining,
    backToItTimeRemaining,
    rerolls,
    selectedReward,
    workSessionDurationRemaining,
    pausedFrom,
    nextFocusDuration,
  } = timerState;

  // Show loading state until timer state is loaded
  if (!isLoaded) {
    return (
      <div className={styles.mainPage}>
        <NavBar />
        <div>Loading...</div>
      </div>
    );
  }

  // Show welcome view if user hasn't onboarded
  if (!hasOnboarded) {
    return (
      <div className={styles.mainPage}>
        <WelcomeView />
      </div>
    );
  }

  const renderContent = () => {
    switch (sessionState) {
      case 'BEFORE_SESSION':
        return (
          <BeforeSessionView
            workSessionDurationRemaining={workSessionDurationRemaining}
            nextFocusDuration={nextFocusDuration}
            formatTime={formatTime}
            startFocusSession={startFocusSession}
          />
        );

      case 'DURING_SESSION':
        return (
          <DuringSessionView
            focusSessionDurationRemaining={focusSessionDurationRemaining}
            formatTime={formatTime}
            pauseSession={pauseSession}
          />
        );

      case 'PAUSED':
        return (
          <PausedView
            focusSessionDurationRemaining={focusSessionDurationRemaining}
            backToItTimeRemaining={backToItTimeRemaining}
            pausedFrom={pausedFrom}
            formatTime={formatTime}
            resumeSession={resumeSession}
            endSessionEarly={endSessionEarly}
          />
        );

      case 'REWARD_SELECTION':
        return (
          <RewardSelectionView
            rewards={rewards}
            rerolls={rerolls}
            selectReward={selectReward}
            handleReroll={handleReroll}
          />
        );

      case 'BREAK':
        return (
          <BreakView
            breakSessionDurationRemaining={breakSessionDurationRemaining}
            selectedReward={selectedReward}
            formatTime={formatTime}
            endSessionEarly={endSessionEarly}
          />
        );

      case 'BACK_TO_IT':
        return (
          <BackToItView
            workSessionDurationRemaining={workSessionDurationRemaining}
            backToItTimeRemaining={backToItTimeRemaining}
            formatTime={formatTime}
            startFocusSession={startFocusSession}
            pauseSession={pauseSession}
          />
        );

      case 'SESSION_COMPLETE':
        return <SessionCompleteView resetTimerState={resetTimerState} />;

      default:
        return null;
    }
  };

  return (
    <div className={styles.mainPage}>
      <NavBar />
      {renderContent()}
    </div>
  );
};

export default MainPage;
