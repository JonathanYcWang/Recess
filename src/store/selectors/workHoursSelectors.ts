import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector
export const selectWorkHoursState = (state: RootState) => state.workHours;

// Memoized selectors
export const selectWorkHoursEntries = createSelector(
  [selectWorkHoursState],
  (workHours) => workHours.entries
);

export const selectIsWorkHoursLoaded = createSelector(
  [selectWorkHoursState],
  (workHours) => workHours.isLoaded
);

export const selectEnabledWorkHoursEntries = createSelector([selectWorkHoursEntries], (entries) =>
  entries.filter((entry) => entry.enabled)
);

export const selectWorkHoursEntryById = (id: string) =>
  createSelector([selectWorkHoursEntries], (entries) => entries.find((entry) => entry.id === id));
