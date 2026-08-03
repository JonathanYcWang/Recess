import { generateRewardSet } from '@/Background/Services/Reward/RewardService';
import { DEFAULT_REROLLS, SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import { createDefaultRecessPickerState } from '@/Shared/State/defaults';
import type { PersistedAppState, SchedulerState } from '@/Shared/Types/AppState';

export const isEnteringRecessPicker = (
  state: PersistedAppState,
  nextScheduler: SchedulerState
): boolean =>
  state.scheduler.activePhase !== SCHEDULER_PHASE.REWARD_GAME &&
  nextScheduler.activePhase === SCHEDULER_PHASE.REWARD_GAME &&
  state.blockList.length > 0;

export const isExitingRecess = (state: PersistedAppState, nextScheduler: SchedulerState): boolean =>
  state.scheduler.activePhase === SCHEDULER_PHASE.RECESS &&
  nextScheduler.activePhase !== SCHEDULER_PHASE.RECESS;

export const enterRecessPicker = (
  state: PersistedAppState,
  nextScheduler: SchedulerState
): PersistedAppState => ({
  ...state,
  scheduler: nextScheduler,
  recessPicker: {
    ...state.recessPicker,
    recessOptions: generateRewardSet(state.blockList),
    selectedRecess: null,
    rerolls: DEFAULT_REROLLS,
  },
});

export const exitRecess = (
  state: PersistedAppState,
  nextScheduler: SchedulerState
): PersistedAppState => ({
  ...state,
  scheduler: nextScheduler,
  recessPicker: createDefaultRecessPickerState(),
});
