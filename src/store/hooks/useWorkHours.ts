import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  addWorkHoursEntry,
  updateWorkHoursEntry,
  deleteWorkHoursEntry,
  toggleWorkHoursEntry,
} from '../slices/workHoursSlice';
import { selectWorkHoursEntries, selectWorkHoursIsLoaded } from '../selectors/workHoursSelectors';

export const useWorkHoursRedux = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectWorkHoursEntries);
  const isLoaded = useAppSelector(selectWorkHoursIsLoaded);

  const addEntry = useCallback(
    (startTime: string, endTime: string, days: boolean[]) => {
      dispatch(addWorkHoursEntry({ startTime, endTime, days }));
    },
    [dispatch]
  );

  const updateEntry = useCallback(
    (id: string, startTime: string, endTime: string, days: boolean[]) => {
      dispatch(updateWorkHoursEntry({ id, startTime, endTime, days }));
    },
    [dispatch]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      dispatch(deleteWorkHoursEntry(id));
    },
    [dispatch]
  );

  const toggleEntry = useCallback(
    (id: string) => {
      dispatch(toggleWorkHoursEntry(id));
    },
    [dispatch]
  );

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleEntry,
  };
};
