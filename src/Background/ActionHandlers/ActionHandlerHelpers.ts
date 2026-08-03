import { generateRewardSet } from '@/Background/Services/Reward/RewardService';
import {
  DEFAULT_BLOCK_LIST_ENTRIES,
  DEFAULT_REROLLS,
  SCHEDULER_PHASE,
  WORK_SESSION_DURATION,
} from '@/Shared/Constants/Constants';
import type {
  BlockListEntry,
  PersistedAppState,
  RecessPickerState,
  SchedulerState,
} from '@/Shared/Types/AppState';

export const createDefaultBlockList = (): BlockListEntry[] =>
  DEFAULT_BLOCK_LIST_ENTRIES.map((url) => ({ url, isBlocked: false }));

export const createDefaultSchedulerState = (): SchedulerState => ({
  activePhase: null,
  phaseStart: null,
  phaseTarget: 0,
  workSessionTarget: WORK_SESSION_DURATION,
  workSessionRemaining: WORK_SESSION_DURATION,
});

export const createDefaultRecessPickerState = (): RecessPickerState => ({
  rerolls: DEFAULT_REROLLS,
  selectedRecess: null,
  recessOptions: [],
});

export const createDefaultPersistedAppState = (): PersistedAppState => ({
  blockList: createDefaultBlockList(),
  scheduler: createDefaultSchedulerState(),
  recessPicker: createDefaultRecessPickerState(),
});

export const isEnteringRecessPicker = (
  state: PersistedAppState,
  nextScheduler: SchedulerState
): boolean =>
  state.scheduler.activePhase !== SCHEDULER_PHASE.REWARD_GAME &&
  nextScheduler.activePhase === SCHEDULER_PHASE.REWARD_GAME &&
  state.blockList.length > 0;

export const isExitingRecess = (
  state: PersistedAppState,
  nextScheduler: SchedulerState
): boolean =>
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
