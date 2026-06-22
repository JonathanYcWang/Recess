import { createReducer } from '@reduxjs/toolkit';
import { WorkHoursEntry } from '../../types/workHours';
import {
  addWorkHoursEntry,
  deleteWorkHoursEntry,
  markWorkHoursLoaded,
  setWorkHours,
  toggleWorkHoursEntry,
  updateWorkHoursEntry,
} from '../actions/workHoursActions';
import { createInitialWorkHoursState } from '../initialState';
import type { WorkHoursState } from '../initialState';

const initialState: WorkHoursState = createInitialWorkHoursState();

const workHoursReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setWorkHours, (state, action) => {
      state.entries = action.payload;
      state.isLoaded = true;
    })
    .addCase(addWorkHoursEntry, (state, action) => {
      const newEntry: WorkHoursEntry = {
        id: Date.now().toString(),
        time: action.payload.time,
        days: action.payload.days,
        enabled: true,
      };
      state.entries.push(newEntry);
    })
    .addCase(updateWorkHoursEntry, (state, action) => {
      const index = state.entries.findIndex((entry) => entry.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = {
          ...state.entries[index],
          time: action.payload.time,
          days: action.payload.days,
        };
      }
    })
    .addCase(deleteWorkHoursEntry, (state, action) => {
      state.entries = state.entries.filter((entry) => entry.id !== action.payload);
    })
    .addCase(toggleWorkHoursEntry, (state, action) => {
      const index = state.entries.findIndex((entry) => entry.id === action.payload);
      if (index !== -1) {
        state.entries[index].enabled = !state.entries[index].enabled;
      }
    })
    .addCase(markWorkHoursLoaded, (state) => {
      state.isLoaded = true;
    });
});

export default workHoursReducer;
