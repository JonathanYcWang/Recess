import { createAction } from '@reduxjs/toolkit';
import { WorkHoursEntry } from '../../types/workHours';

export const setWorkHours = createAction<WorkHoursEntry[]>('workHours/setWorkHours');
export const addWorkHoursEntry = createAction<{ time: string; days: boolean[] }>(
  'workHours/addWorkHoursEntry'
);
export const updateWorkHoursEntry = createAction<{ id: string; time: string; days: boolean[] }>(
  'workHours/updateWorkHoursEntry'
);
export const deleteWorkHoursEntry = createAction<string>('workHours/deleteWorkHoursEntry');
export const toggleWorkHoursEntry = createAction<string>('workHours/toggleWorkHoursEntry');
export const markWorkHoursLoaded = createAction('workHours/markWorkHoursLoaded');
