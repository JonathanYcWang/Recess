import { createAction } from '@reduxjs/toolkit';
import type { ReminderScheduleProjection } from '@/modules/work-start-reminder';
import type { WorkStartReminderConnectionState } from '../reducers/workStartReminderProjectionReducer';

export const setWorkStartReminderProjection = createAction<{
  revision: number;
  schedules: ReminderScheduleProjection[];
}>('workStartReminderProjection/setProjection');

export const setWorkStartReminderConnectionState = createAction<WorkStartReminderConnectionState>(
  'workStartReminderProjection/setConnectionState'
);
