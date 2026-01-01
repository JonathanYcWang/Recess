import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Basic selectors
export const selectWorkHoursState = (state: RootState) => state.workHours;
export const selectWorkHoursEntries = (state: RootState) => state.workHours.entries;
export const selectWorkHoursIsLoaded = (state: RootState) => state.workHours.isLoaded;

// Memoized selectors
export const selectEnabledWorkHours = createSelector([selectWorkHoursEntries], (entries) =>
  entries.filter((entry) => entry.enabled)
);

export const selectWorkHoursCount = createSelector(
  [selectWorkHoursEntries],
  (entries) => entries.length
);

export const selectHasWorkHours = createSelector([selectWorkHoursCount], (count) => count > 0);

// Helper to get specific entry by ID
export const selectWorkHoursEntryById = createSelector(
  [selectWorkHoursEntries, (_state: RootState, id: string) => id],
  (entries, id) => entries.find((entry) => entry.id === id)
);
