import { useSelector } from 'react-redux';
import NavBar from '../../components/NavBar/NavBar';
import { useTimer } from '../../hooks/useTimer';
import { selectHasOnboarded } from '../../store/selectors';
import type { RootState } from '../../store';
import WelcomeView from '../../views/WelcomeView/WelcomeView';
import BeforeWorkSessionView from '../../views/BeforeWorkSessionView/BeforeWorkSessionView';
import OngoingFocusSessionView from '../../views/OngoingFocusSessionView/OngoingFocusSessionView';
import RewardSelectionView from '../../views/RewardSelectionView/RewardSelectionView';
import OngoingBreakSessionView from '../../views/OngoingBreakSessionView/OngoingBreakSessionView';
import FocusSessionCountdownView from '../../views/FocusSessionCountdownView/FocusSessionCountdownView';
import WorkSessionCompleteView from '../../views/WorkSessionCompleteView/WorkSessionCompleteView';
import styles from './MainPage.module.css';

const MainPage = () => {
  const hasOnboarded = useSelector((state: RootState) => selectHasOnboarded(state));
  const {
    timerState,
    currentRemaining,
    startFocusSession,
    pauseSession,
    resumeSession,
    selectReward,
    handleReroll,
    endSessionEarly,
    endWorkSessionEarly,
    transitionToBeforeWorkSession,
    setTotalTimer,
    updateWeightMultipliers,
    rewards,
    formatTime,
    isLoaded,
  } = useTimer();

  const currentTimer = timerState.currentTimer;
  const totalRemaining = timerState.totalRemaining;

  const { sessionState, isPaused, rerolls, selectedReward } = timerState;

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
            totalRemaining={totalRemaining}
            nextFocusDuration={currentTimer}
            formatTime={formatTime}
            startFocusSession={startFocusSession}
            onDurationChange={setTotalTimer}
          />
        );

      case 'ONGOING_FOCUS_SESSION':
        return (
          <OngoingFocusSessionView
            sessionDurationRemaining={currentRemaining}
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
            sessionDurationRemaining={currentRemaining}
            selectedReward={selectedReward}
            formatTime={formatTime}
            endSessionEarly={endSessionEarly}
          />
        );

      case 'FOCUS_SESSION_COUNTDOWN':
        return (
          <FocusSessionCountdownView
            workSessionDurationRemaining={totalRemaining}
            sessionDurationRemaining={currentRemaining}
            formatTime={formatTime}
            startFocusSession={startFocusSession}
            updateWeightMultipliers={updateWeightMultipliers}
            endWorkSessionEarly={endWorkSessionEarly}
          />
        );

      case 'WORK_SESSION_COMPLETE':
        return (
          <WorkSessionCompleteView transitionToBeforeWorkSession={transitionToBeforeWorkSession} />
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.mainPage}>
      {sessionState !== 'REWARD_SELECTION' && <NavBar />}
      {renderContent()}
    </div>
  );
};

export default MainPage;
