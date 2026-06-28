import { createSelector } from '@reduxjs/toolkit';
import type { ReminderScheduleProjection } from '@/modules/work-start-reminder';
import type { RootState } from '../index';

const selectWorkStartReminderProjectionState = (state: RootState) =>
  state.workStartReminderProjection;

export const selectWorkStartReminderSchedules = createSelector(
  [selectWorkStartReminderProjectionState],
  (projection): ReminderScheduleProjection[] => projection.schedules
);

export const selectWorkStartReminderRevision = (state: RootState): number | null =>
  state.workStartReminderProjection.revision;

export const selectWorkStartReminderConnectionState = (state: RootState) =>
  state.workStartReminderProjection.connectionState;

export const selectIsWorkStartReminderDisconnected = (state: RootState): boolean =>
  state.workStartReminderProjection.connectionState === 'disconnected';
