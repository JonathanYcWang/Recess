import { createReducer } from '@reduxjs/toolkit';
import type { ReminderScheduleProjection } from '@/modules/work-start-reminder';
import {
  setWorkStartReminderConnectionState,
  setWorkStartReminderProjection,
} from '../actions/workStartReminderProjectionActions';

export type WorkStartReminderConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface WorkStartReminderProjectionState {
  revision: number | null;
  schedules: ReminderScheduleProjection[];
  connectionState: WorkStartReminderConnectionState;
}

const initialState: WorkStartReminderProjectionState = {
  revision: null,
  schedules: [],
  connectionState: 'connecting',
};

const workStartReminderProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setWorkStartReminderProjection, (state, action) => {
      state.revision = action.payload.revision;
      state.schedules = action.payload.schedules.map((schedule) => ({
        ...schedule,
        days: [...schedule.days],
      }));
      state.connectionState = 'connected';
    })
    .addCase(setWorkStartReminderConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default workStartReminderProjectionReducer;
