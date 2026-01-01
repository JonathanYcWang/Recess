import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkHoursEntry } from '../../lib/types';

interface WorkHoursState {
  entries: WorkHoursEntry[];
  isLoaded: boolean;
}

const initialState: WorkHoursState = {
  entries: [],
  isLoaded: false,
};

const workHoursSlice = createSlice({
  name: 'workHours',
  initialState,
  reducers: {
    setWorkHours: (state, action: PayloadAction<WorkHoursEntry[]>) => {
      state.entries = action.payload;
      state.isLoaded = true;
    },

    addWorkHoursEntry: (
      state,
      action: PayloadAction<{ startTime: string; endTime: string; days: boolean[] }>
    ) => {
      const newEntry: WorkHoursEntry = {
        id: Date.now().toString(),
        startTime: action.payload.startTime,
        endTime: action.payload.endTime,
        days: action.payload.days,
        enabled: true,
      };
      state.entries.push(newEntry);
    },

    updateWorkHoursEntry: (
      state,
      action: PayloadAction<{ id: string; startTime: string; endTime: string; days: boolean[] }>
    ) => {
      const index = state.entries.findIndex((entry) => entry.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = {
          ...state.entries[index],
          startTime: action.payload.startTime,
          endTime: action.payload.endTime,
          days: action.payload.days,
        };
      }
    },

    deleteWorkHoursEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter((entry) => entry.id !== action.payload);
    },

    toggleWorkHoursEntry: (state, action: PayloadAction<string>) => {
      const index = state.entries.findIndex((entry) => entry.id === action.payload);
      if (index !== -1) {
        state.entries[index].enabled = !state.entries[index].enabled;
      }
    },

    markWorkHoursLoaded: (state) => {
      state.isLoaded = true;
    },
  },
});

export const {
  setWorkHours,
  addWorkHoursEntry,
  updateWorkHoursEntry,
  deleteWorkHoursEntry,
  toggleWorkHoursEntry,
  markWorkHoursLoaded,
} = workHoursSlice.actions;

export default workHoursSlice.reducer;
