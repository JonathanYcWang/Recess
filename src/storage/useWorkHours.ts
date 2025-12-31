import { useState, useEffect, useCallback } from 'react';
import { useStorage } from './StorageContext';
import { WorkHoursEntry } from './types';

const WORK_HOURS_STORAGE_KEY = 'workHours';

interface UseWorkHoursReturn {
  entries: WorkHoursEntry[];
  isLoaded: boolean;
  addEntry: (startTime: string, endTime: string, days: boolean[]) => Promise<void>;
  updateEntry: (id: string, startTime: string, endTime: string, days: boolean[]) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleEntry: (id: string) => Promise<void>;
}

/**
 * Hook for managing work hours entries with persistent storage
 */
export const useWorkHours = (): UseWorkHoursReturn => {
  const storage = useStorage();
  const [entries, setEntries] = useState<WorkHoursEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load entries from storage on mount
  useEffect(() => {
    const loadEntries = async () => {
      if (!storage.isReady) return;

      const storedEntries = await storage.get<WorkHoursEntry[]>(WORK_HOURS_STORAGE_KEY);
      if (storedEntries) {
        setEntries(storedEntries);
      }
      setIsLoaded(true);
    };

    loadEntries();
  }, [storage]);

  // Save entries to storage whenever they change
  useEffect(() => {
    if (isLoaded && storage.isReady) {
      storage.set(WORK_HOURS_STORAGE_KEY, entries);
    }
  }, [entries, isLoaded, storage]);

  const addEntry = useCallback(
    async (startTime: string, endTime: string, days: boolean[]) => {
      const newEntry: WorkHoursEntry = {
        id: Date.now().toString(),
        startTime,
        endTime,
        days,
        enabled: true,
      };

      setEntries((prev) => [...prev, newEntry]);
    },
    []
  );

  const updateEntry = useCallback(
    async (id: string, startTime: string, endTime: string, days: boolean[]) => {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, startTime, endTime, days }
            : entry
        )
      );
    },
    []
  );

  const deleteEntry = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const toggleEntry = useCallback(async (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, enabled: !entry.enabled } : entry
      )
    );
  }, []);

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleEntry,
  };
};
