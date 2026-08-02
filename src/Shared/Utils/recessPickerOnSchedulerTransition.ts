import { DEFAULT_REROLLS, SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import type {
  PersistedAppState,
  RecessPickerState,
  SchedulerPhase,
  SchedulerState,
} from '@/Shared/Types/AppState';

export const createDefaultRecessPickerState = (): RecessPickerState => ({
  rerolls: DEFAULT_REROLLS,
  selectedRecess: null,
  recessOptions: [],
});

const isLeavingRecess = (
  previousPhase: SchedulerPhase | null,
  nextPhase: SchedulerPhase | null
): boolean =>
  previousPhase === SCHEDULER_PHASE.RECESS && nextPhase !== SCHEDULER_PHASE.RECESS;

export const applyRecessPickerAfterSchedulerChange = (
  recessPicker: RecessPickerState,
  previousScheduler: SchedulerState,
  nextScheduler: SchedulerState
): RecessPickerState => {
  if (isLeavingRecess(previousScheduler.activePhase, nextScheduler.activePhase)) {
    return createDefaultRecessPickerState();
  }

  return recessPicker;
};

export const withUpdatedScheduler = (
  state: PersistedAppState,
  nextScheduler: SchedulerState
): PersistedAppState => ({
  ...state,
  scheduler: nextScheduler,
  recessPicker: applyRecessPickerAfterSchedulerChange(
    state.recessPicker,
    state.scheduler,
    nextScheduler
  ),
});
