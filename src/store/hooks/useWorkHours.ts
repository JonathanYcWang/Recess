import { useAppDispatch, useAppSelector } from '../hooks';
import {
  addWorkHoursEntry,
  updateWorkHoursEntry,
  deleteWorkHoursEntry,
  toggleWorkHoursEntry,
} from '../slices/workHoursSlice';

export const useWorkHours = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((state) => state.workHours.entries);
  const isLoaded = useAppSelector((state) => state.workHours.isLoaded);

  return {
    entries,
    isLoaded,
    addEntry: (startTime: string, endTime: string, days: boolean[]) =>
      dispatch(addWorkHoursEntry({ startTime, endTime, days })),
    updateEntry: (id: string, startTime: string, endTime: string, days: boolean[]) =>
      dispatch(updateWorkHoursEntry({ id, startTime, endTime, days })),
    deleteEntry: (id: string) => dispatch(deleteWorkHoursEntry(id)),
    toggleEntry: (id: string) => dispatch(toggleWorkHoursEntry(id)),
  };
};
