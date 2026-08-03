import {
  DEFAULT_BLOCK_LIST_ENTRIES,
  DEFAULT_REROLLS,
  WORK_SESSION_DURATION,
} from '@/Shared/Constants/Constants';
import type {
  BlockListEntry,
  PersistedAppState,
  RecessPickerState,
  SchedulerState,
} from '@/Shared/Types/AppState';

const createDefaultBlockList = (): BlockListEntry[] =>
  DEFAULT_BLOCK_LIST_ENTRIES.map((url) => ({ url, isBlocked: false }));

const createDefaultSchedulerState = (): SchedulerState => ({
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
