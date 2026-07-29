// import TaskList from '@/UI/Components/TaskList/TaskList';
// import FocusTaskSelection from '@/UI/Components/FocusTaskSelection/FocusTaskSelection';
import { useSelector } from 'react-redux';
import type { RootState } from '@/UI/Redux/store';
import { selectScheduler } from '@/UI/Redux/Selectors/Scheduler/schedulerSelectors';
import { SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import BeforeWorkSessionView from '@/UI/Views/BeforeWorkSessionView/BeforeWorkSessionView';
import OngoingFocusSessionView from '@/UI/Views/OngoingFocusSessionView/OngoingFocusSessionView';
import RewardSelectionView from '@/UI/Views/RewardSelectionView/RewardSelectionView';
import OngoingBreakSessionView from '@/UI/Views/OngoingBreakSessionView/OngoingBreakSessionView';
import styles from './WorkPage.module.css';

const WorkPage = () => {
  const activePhase = useSelector((state: RootState) => selectScheduler(state).activePhase);

  const renderContent = () => {
    switch (activePhase) {
      case null:
        return <BeforeWorkSessionView />;

      case SCHEDULER_PHASE.FOCUS_BLOCK:
        return <OngoingFocusSessionView />;

      case SCHEDULER_PHASE.REWARD_GAME:
        return <RewardSelectionView />;

      case SCHEDULER_PHASE.RECESS:
        return <OngoingBreakSessionView />;

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
