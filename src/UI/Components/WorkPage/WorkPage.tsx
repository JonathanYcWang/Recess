// import TaskList from '@/UI/Components/TaskList/TaskList';
// import FocusTaskSelection from '@/UI/Components/FocusTaskSelection/FocusTaskSelection';
import { useTimer } from '@/UI/Hooks/useTimer';
import BeforeWorkSessionView from '@/UI/Views/BeforeWorkSessionView/BeforeWorkSessionView';
import OngoingFocusSessionView from '@/UI/Views/OngoingFocusSessionView/OngoingFocusSessionView';
import RewardSelectionView from '@/UI/Views/RewardSelectionView/RewardSelectionView';
import OngoingBreakSessionView from '@/UI/Views/OngoingBreakSessionView/OngoingBreakSessionView';
import FocusSessionCountdownView from '@/UI/Views/FocusSessionCountdownView/FocusSessionCountdownView';
// import WorkSessionCompleteView from '@/UI/Views/WorkSessionCompleteView/WorkSessionCompleteView';
import styles from './WorkPage.module.css';
import { SESSION_STATES } from '../../../Shared/Constants/Constants';

const WorkPage = () => {
  const {
    currentTimer,
    currentRemaining,
    totalRemaining,
    startFocusSession,
    pauseSession,
    resumeSession,
    selectReward,
    handleReroll,
    endSessionEarly,
    endWorkSessionEarly,
    // transitionToBeforeWorkSession,
    setTotalTimer,
    updateFeedbackMultiplier,
    isPaused,
    sessionState,
  } = useTimer();

  const renderContent = () => {
    switch (sessionState) {
      case SESSION_STATES.BEFORE_WORK_SESSION:
        return (
          <BeforeWorkSessionView
            startFocusSession={startFocusSession}
            onDurationChange={setTotalTimer}
          />
        );

      case SESSION_STATES.ONGOING_FOCUS_SESSION:
        return (
          <OngoingFocusSessionView
            isPaused={isPaused}
            currentTimer={currentTimer}
            currentRemaining={currentRemaining}
            totalRemaining={totalRemaining}
            pauseSession={pauseSession}
            resumeSession={resumeSession}
            endSessionEarly={endSessionEarly}
          />
        );

      case SESSION_STATES.REWARD_SELECTION:
        return <RewardSelectionView selectReward={selectReward} handleReroll={handleReroll} />;

      case SESSION_STATES.ONGOING_BREAK_SESSION:
        return (
          <OngoingBreakSessionView
            currentTimer={currentTimer}
            currentRemaining={currentRemaining}
            endSessionEarly={endSessionEarly}
          />
        );

      case SESSION_STATES.FOCUS_SESSION_COUNTDOWN:
        return (
          <FocusSessionCountdownView
            currentTimer={currentTimer}
            currentRemaining={currentRemaining}
            startFocusSession={startFocusSession}
            updateFeedbackMultiplier={updateFeedbackMultiplier}
            endWorkSessionEarly={endWorkSessionEarly}
          />
        );

      // case SESSION_STATES.WORK_SESSION_COMPLETE:
      //   return (
      //     <WorkSessionCompleteView transitionToBeforeWorkSession={transitionToBeforeWorkSession} />
      //   );

      default:
        return null;
    }
  };

  return (
    <div className={styles.workPage}>
      {/* <TaskList /> */}
      {/* <FocusTaskSelection /> */}
      {renderContent()}
    </div>
  );
};

export default WorkPage;
