import { Middleware, AnyAction } from '@reduxjs/toolkit';

// Storage keys
const STORAGE_KEYS = {
  timer: 'timerState',
  workHours: 'workHours',
  blockedSites: 'blockedSites',
  routing: 'hasOnboarded',
};

// Helper functions for chrome.storage.local with localStorage fallback
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

// Middleware to persist state changes to storage
export const storageMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  const typedAction = action as AnyAction;

  // Persist state changes after action is processed
  // We'll debounce or throttle this in production, but for now persist immediately
  if (typedAction.type && typedAction.type.startsWith('timer/')) {
    storageAPI.set(STORAGE_KEYS.timer, state.timer);
  }
  if (typedAction.type && typedAction.type.startsWith('workHours/')) {
    storageAPI.set(STORAGE_KEYS.workHours, state.workHours.entries);
  }
  if (typedAction.type && typedAction.type.startsWith('blockedSites/')) {
    storageAPI.set(STORAGE_KEYS.blockedSites, state.blockedSites.sites);
  }
  if (typedAction.type && typedAction.type.startsWith('routing/')) {
    storageAPI.set(STORAGE_KEYS.routing, state.routing.hasOnboarded);
  }

  return result;
};

// Load initial state from storage
export const loadStateFromStorage = async () => {
  const [timerState, workHoursEntries, blockedSites, hasOnboarded] = await Promise.all([
    storageAPI.get(STORAGE_KEYS.timer),
    storageAPI.get<any[]>(STORAGE_KEYS.workHours),
    storageAPI.get<string[]>(STORAGE_KEYS.blockedSites),
    storageAPI.get<boolean>(STORAGE_KEYS.routing),
  ]);

  return {
    timer: timerState,
    workHours: workHoursEntries ? workHoursEntries : undefined,
    blockedSites: blockedSites,
    routing: hasOnboarded !== undefined ? hasOnboarded : undefined,
  };
};

export { storageAPI };
