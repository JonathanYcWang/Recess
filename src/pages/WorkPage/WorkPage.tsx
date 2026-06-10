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
import styles from './WorkPage.module.css';
import { SESSION_STATES } from '../../constants/constants';

const WorkPage = () => {
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
    updateFeedbackMultiplier,
    rewards,
  } = useTimer();

  const currentTimer = timerState.currentTimer;
  const totalRemaining = timerState.totalRemaining;

  const { sessionState, isPaused, rerolls, selectedReward } = timerState;

  if (!hasOnboarded) {
    return (
      <div className={styles.workPage}>
        <WelcomeView />
      </div>
    );
  }

  const renderContent = () => {
    switch (sessionState) {
      case SESSION_STATES.BEFORE_WORK_SESSION:
        return (
          <BeforeWorkSessionView
            totalRemaining={totalRemaining}
            nextFocusDuration={currentTimer}
            startFocusSession={startFocusSession}
            onDurationChange={setTotalTimer}
          />
        );

      case SESSION_STATES.ONGOING_FOCUS_SESSION:
        return (
          <OngoingFocusSessionView
            sessionDurationRemaining={currentRemaining}
            isPaused={isPaused}
            pauseSession={pauseSession}
            resumeSession={resumeSession}
            endSessionEarly={endSessionEarly}
          />
        );

      case SESSION_STATES.REWARD_SELECTION:
        return (
          <RewardSelectionView
            rewards={rewards}
            rerolls={rerolls}
            selectReward={selectReward}
            handleReroll={handleReroll}
          />
        );

      case SESSION_STATES.ONGOING_BREAK_SESSION:
        return (
          <OngoingBreakSessionView
            sessionDurationRemaining={currentRemaining}
            selectedReward={selectedReward}
            endSessionEarly={endSessionEarly}
          />
        );

      case SESSION_STATES.FOCUS_SESSION_COUNTDOWN:
        return (
          <FocusSessionCountdownView
            workSessionDurationRemaining={totalRemaining}
            sessionDurationRemaining={currentRemaining}
            startFocusSession={startFocusSession}
            updateFeedbackMultiplier={updateFeedbackMultiplier}
            endWorkSessionEarly={endWorkSessionEarly}
          />
        );

      case SESSION_STATES.WORK_SESSION_COMPLETE:
        return (
          <WorkSessionCompleteView transitionToBeforeWorkSession={transitionToBeforeWorkSession} />
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.workPage}>
      {sessionState !== SESSION_STATES.REWARD_SELECTION && <NavBar />}
      {renderContent()}
    </div>
  );
};

export default WorkPage;
