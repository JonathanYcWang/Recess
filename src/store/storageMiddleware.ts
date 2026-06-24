import type { Middleware, AnyAction } from '@reduxjs/toolkit';
import type { QuizReduxState } from './actions/quizActions';
import {
  createInitialBlockedSitesState,
  createInitialQuizState,
  createInitialRoutingState,
  createInitialTimerState,
} from './initialState';

const STORAGE_KEYS = {
  timer: 'timerState',
  blockedSites: 'blockedSites',
  routing: 'hasOnboarded',
  quiz: 'quizState',
};

const storageAPI = {
  get: async <T = unknown>(key: string): Promise<T | undefined> => {
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

  set: async <T = unknown>(key: string, value: T): Promise<void> => {
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

type PersistedBlockedSites = string[] | { sites?: unknown } | undefined;

const getInitialPersistedState = () => ({
  [STORAGE_KEYS.timer]: createInitialTimerState(),
  [STORAGE_KEYS.blockedSites]: createInitialBlockedSitesState(),
  [STORAGE_KEYS.routing]: createInitialRoutingState().hasOnboarded,
  [STORAGE_KEYS.quiz]: createInitialQuizState(),
});

const normalizeBlockedSites = (persisted: PersistedBlockedSites): string[] | undefined => {
  if (Array.isArray(persisted)) {
    return persisted.filter((site): site is string => typeof site === 'string');
  }

  if (persisted && Array.isArray(persisted.sites)) {
    return persisted.sites.filter((site): site is string => typeof site === 'string');
  }

  return undefined;
};

export const storageMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  const typedAction = action as AnyAction;

  if (typedAction.type && typedAction.type.startsWith('timer/')) {
    storageAPI.set(STORAGE_KEYS.timer, state.timer);
  }
  if (typedAction.type && typedAction.type.startsWith('blockedSites/')) {
    storageAPI.set(STORAGE_KEYS.blockedSites, state.blockedSites);
  }
  if (typedAction.type && typedAction.type.startsWith('routing/')) {
    storageAPI.set(STORAGE_KEYS.routing, state.routing.hasOnboarded);
  }

  if (typedAction.type && typedAction.type.startsWith('quiz/')) {
    storageAPI.set(STORAGE_KEYS.quiz, state.quiz);
  }

  return result;
};

export const seedInitialStateInStorage = async () => {
  const initialPersistedState = getInitialPersistedState();

  await Promise.all(
    Object.entries(initialPersistedState).map(async ([key, value]) => {
      const persistedValue = await storageAPI.get(key);

      if (persistedValue === undefined) {
        await storageAPI.set(key, value);
      }
    })
  );
};

export const loadStateFromStorage = async () => {
  const [timerState, blockedSitesState, hasOnboarded, quizState] = await Promise.all([
    storageAPI.get(STORAGE_KEYS.timer),
    storageAPI.get<PersistedBlockedSites>(STORAGE_KEYS.blockedSites),
    storageAPI.get<boolean>(STORAGE_KEYS.routing),
    storageAPI.get<QuizReduxState>(STORAGE_KEYS.quiz),
  ]);

  return {
    timer: timerState,
    blockedSites: normalizeBlockedSites(blockedSitesState),
    routing: hasOnboarded !== undefined ? hasOnboarded : undefined,
    quiz: quizState,
  };
};
