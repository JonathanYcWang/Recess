import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector
const selectWorkHoursState = (state: RootState) => state.workHours;

// Memoized selectors
export const selectWorkHoursEntries = createSelector(
  [selectWorkHoursState],
  (workHours) => workHours.entries
);
