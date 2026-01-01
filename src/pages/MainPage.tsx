import React from 'react';
import NavBar from '../components/NavBar';
import { useTimer } from '../store/hooks/useTimer';
import { useAppSelector } from '../store/hooks';
import WelcomeView from './views/WelcomeView';
import BeforeWorkSessionView from './views/BeforeWorkSessionView';
import OngoingFocusSessionView from './views/OngoingFocusSessionView';
import RewardSelectionView from './views/RewardSelectionView';
import OngoingBreakSessionView from './views/OngoingBreakSessionView';
import FocusSessionCountdownView from './views/FocusSessionCountdownView';
import WorkSessionCompleteView from './views/WorkSessionCompleteView';
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
    isPaused,
    focusSessionDurationRemaining,
    breakSessionDurationRemaining,
    focusSessionCountdownTimeRemaining,
    rerolls,
    selectedReward,
    workSessionDurationRemaining,
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
      case 'BEFORE_WORK_SESSION':
        return (
          <BeforeWorkSessionView
            workSessionDurationRemaining={workSessionDurationRemaining}
            nextFocusDuration={nextFocusDuration}
            formatTime={formatTime}
            startFocusSession={startFocusSession}
          />
        );

      case 'ONGOING_FOCUS_SESSION':
        return (
          <OngoingFocusSessionView
            focusSessionDurationRemaining={focusSessionDurationRemaining}
            isPaused={isPaused}
            formatTime={formatTime}
            pauseSession={pauseSession}
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

      case 'ONGOING_BREAK_SESSION':
        return (
          <OngoingBreakSessionView
            breakSessionDurationRemaining={breakSessionDurationRemaining}
            selectedReward={selectedReward}
            formatTime={formatTime}
            endSessionEarly={endSessionEarly}
          />
        );

      case 'FOCUS_SESSION_COUNTDOWN':
        return (
          <FocusSessionCountdownView
            workSessionDurationRemaining={workSessionDurationRemaining}
            focusSessionCountdownTimeRemaining={focusSessionCountdownTimeRemaining}
            formatTime={formatTime}
            startFocusSession={startFocusSession}
          />
        );

      case 'WORK_SESSION_COMPLETE':
        return <WorkSessionCompleteView resetTimerState={resetTimerState} />;

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
