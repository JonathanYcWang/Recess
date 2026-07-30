import type { RootState } from '../../store';
import type { RecessPickerState } from '@/Shared/Types/AppState';
import type { Reward } from '@/Shared/Types/Reward';
import { DEFAULT_REROLLS } from '@/Shared/Constants/Constants';

const defaultRecessPicker = (): RecessPickerState => ({
  rerolls: DEFAULT_REROLLS,
  selectedRecess: null,
  recessOptions: [],
});

export const selectRecessPicker = (state: RootState): RecessPickerState =>
  state.appState?.recessPicker ?? defaultRecessPicker();

export const selectRecessOptions = (state: RootState): Reward[] =>
  selectRecessPicker(state).recessOptions;

export const selectRecessPickerRerolls = (state: RootState): number =>
  selectRecessPicker(state).rerolls;

export const selectSelectedRecess = (state: RootState): Reward | null =>
  selectRecessPicker(state).selectedRecess;
