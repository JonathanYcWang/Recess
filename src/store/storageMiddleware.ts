import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { startWorkingSession, endWorkingSession } from './slices/blockedSitesSlice';

const STORAGE_KEYS = {
  timer: 'timerState',
  workHours: 'workHours',
  blockedSites: 'blockedSites',
  routing: 'hasOnboarded',
};

const storageAPI = {
  get: async <T = any>(key: string): Promise<T | undefined> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] as T | undefined);
        });
      });
    }
    // Fallback to localStorage for development
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : undefined;
    } catch {
      return undefined;
    }
  },

  set: async <T = any>(key: string, value: T): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      });
    }
    // Fallback to localStorage for development
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set storage:', error);
    }
  },

  remove: async (key: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => {
          resolve();
        });
      });
    }
    // Fallback to localStorage for development
    localStorage.removeItem(key);
  },
};

export const storageMiddleware: Middleware = (store) => (next) => (action) => {
  const prevState = store.getState();
  const result = next(action);
  const state = store.getState();
  const typedAction = action as AnyAction;

  // Handle working session state based on timer changes
  if (typedAction.type && typedAction.type.startsWith('timer/')) {
    const prevTimer = prevState.timer;
    const currentTimer = state.timer;
    const prevBlockedSites = prevState.blockedSites;

    // Start working session: First focus session start when not already in a working session
    if (
      typedAction.type === 'timer/startFocusSession' &&
      prevTimer.sessionState === 'BEFORE_WORK_SESSION' &&
      !prevBlockedSites.isInWorkingSession
    ) {
      store.dispatch(startWorkingSession());
    }

    // End working session: When workSessionDurationRemaining becomes 0
    if (
      currentTimer.workSessionDurationRemaining === 0 &&
      prevTimer.workSessionDurationRemaining > 0 &&
      prevBlockedSites.isInWorkingSession
    ) {
      store.dispatch(endWorkingSession());
    }

    storageAPI.set(STORAGE_KEYS.timer, state.timer);
  }
  if (typedAction.type && typedAction.type.startsWith('workHours/')) {
    storageAPI.set(STORAGE_KEYS.workHours, state.workHours.entries);
  }
  if (typedAction.type && typedAction.type.startsWith('blockedSites/')) {
    storageAPI.set(STORAGE_KEYS.blockedSites, state.blockedSites);
  }
  if (typedAction.type && typedAction.type.startsWith('routing/')) {
    storageAPI.set(STORAGE_KEYS.routing, state.routing.hasOnboarded);
  }

  return result;
};

export const loadStateFromStorage = async () => {
  const [timerState, workHoursEntries, blockedSitesState, hasOnboarded] = await Promise.all([
    storageAPI.get(STORAGE_KEYS.timer),
    storageAPI.get<any[]>(STORAGE_KEYS.workHours),
    storageAPI.get<any>(STORAGE_KEYS.blockedSites),
    storageAPI.get<boolean>(STORAGE_KEYS.routing),
  ]);

  return {
    timer: timerState,
    workHours: workHoursEntries ? workHoursEntries : undefined,
    blockedSites: blockedSitesState,
    routing: hasOnboarded !== undefined ? hasOnboarded : undefined,
  };
};

export { storageAPI };
