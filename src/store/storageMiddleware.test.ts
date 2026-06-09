import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SESSION_STATES } from '../constants/constants';
import { setBlockedSites } from './actions/blockedSitesActions';
import { setQuizState } from './actions/quizActions';
import { setHasOnboarded } from './actions/routingActions';
import {
  endWorkSessionEarly,
  setTotalTimer,
  startFocusSession,
  updateTimerState,
} from './actions/timerActions';
import { setWorkHours } from './actions/workHoursActions';
import blockedSitesReducer from './reducers/blockedSitesReducer';
import quizReducer from './reducers/quizReducer';
import routingReducer from './reducers/routingReducer';
import timerReducer from './reducers/timerReducer';
import workHoursReducer from './reducers/workHoursReducer';
import { loadStateFromStorage, storageMiddleware } from './storageMiddleware';

const createTestStore = () =>
  configureStore({
    reducer: {
      timer: timerReducer,
      workHours: workHoursReducer,
      blockedSites: blockedSitesReducer,
      routing: routingReducer,
      quiz: quizReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(storageMiddleware),
  });

const createLocalStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
  };
};

describe('storageMiddleware', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persists each Redux slice to localStorage fallback', () => {
    const localStorage = createLocalStorage();
    vi.stubGlobal('chrome', undefined);
    vi.stubGlobal('localStorage', localStorage);
    const store = createTestStore();

    store.dispatch(setTotalTimer(3600));
    store.dispatch(setWorkHours([{ id: 'weekday', time: '09:00', days: [], enabled: true }]));
    store.dispatch(
      setBlockedSites({
        sites: ['news.example'],
        isLoaded: false,
        isInWorkingSession: true,
      })
    );
    store.dispatch(setHasOnboarded(true));
    store.dispatch(
      setQuizState({
        currentQuestionId: 'Q2',
        selectedChoices: [],
        isComplete: false,
        results: null,
      })
    );

    expect(localStorage.setItem).toHaveBeenCalledWith('timerState', JSON.stringify(store.getState().timer));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'workHours',
      JSON.stringify(store.getState().workHours.entries)
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'blockedSites',
      JSON.stringify(store.getState().blockedSites)
    );
    expect(localStorage.setItem).toHaveBeenCalledWith('hasOnboarded', JSON.stringify(true));
    expect(localStorage.setItem).toHaveBeenCalledWith('quizState', JSON.stringify(store.getState().quiz));
  });

  it('starts and ends blocked-site working sessions from timer transitions', () => {
    const localStorage = createLocalStorage();
    vi.stubGlobal('chrome', undefined);
    vi.stubGlobal('localStorage', localStorage);
    const store = createTestStore();

    store.dispatch(startFocusSession());

    expect(store.getState().blockedSites.isInWorkingSession).toBe(true);

    store.dispatch(endWorkSessionEarly());

    expect(store.getState().timer.totalRemaining).toBe(0);
    expect(store.getState().blockedSites.isInWorkingSession).toBe(false);
  });

  it('persists to chrome storage when the extension API is available', () => {
    const chromeStorage = {
      get: vi.fn(),
      set: vi.fn((_value: Record<string, unknown>, callback: () => void) => {
        callback();
      }),
      remove: vi.fn(),
    };
    vi.stubGlobal('chrome', { storage: { local: chromeStorage } });
    const store = createTestStore();

    store.dispatch(setTotalTimer(3600));

    expect(chromeStorage.set).toHaveBeenCalledWith(
      { timerState: store.getState().timer },
      expect.any(Function)
    );
  });

  it('loads persisted state from chrome storage when available', async () => {
    const chromeStorage = {
      get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const key = keys[0];
        callback({
          [key]: {
            timerState: {
              sessionState: SESSION_STATES.BEFORE_WORK_SESSION,
              totalRemaining: 1,
            },
            workHours: [{ id: 'weekday', time: '09:00', days: [], enabled: true }],
            blockedSites: { sites: ['news.example'], isLoaded: true, isInWorkingSession: false },
            hasOnboarded: true,
            quizState: {
              currentQuestionId: 'Q1',
              selectedChoices: [],
              isComplete: false,
              results: null,
            },
          }[key],
        });
      }),
      set: vi.fn(),
      remove: vi.fn(),
    };
    vi.stubGlobal('chrome', { storage: { local: chromeStorage } });

    await expect(loadStateFromStorage()).resolves.toEqual({
      timer: {
        sessionState: SESSION_STATES.BEFORE_WORK_SESSION,
        totalRemaining: 1,
      },
      workHours: [{ id: 'weekday', time: '09:00', days: [], enabled: true }],
      blockedSites: { sites: ['news.example'], isLoaded: true, isInWorkingSession: false },
      routing: true,
      quiz: {
        currentQuestionId: 'Q1',
        selectedChoices: [],
        isComplete: false,
        results: null,
      },
    });
  });

  it('returns undefined slices when localStorage contains invalid JSON', async () => {
    const localStorage = createLocalStorage();
    localStorage.getItem.mockReturnValue('not json');
    vi.stubGlobal('chrome', undefined);
    vi.stubGlobal('localStorage', localStorage);

    await expect(loadStateFromStorage()).resolves.toEqual({
      timer: undefined,
      workHours: undefined,
      blockedSites: undefined,
      routing: undefined,
      quiz: undefined,
    });
  });

  it('does not end blocked-site working session when total remaining was already zero', () => {
    const localStorage = createLocalStorage();
    vi.stubGlobal('chrome', undefined);
    vi.stubGlobal('localStorage', localStorage);
    const store = createTestStore();

    store.dispatch(startFocusSession());
    store.dispatch(endWorkSessionEarly());
    store.dispatch(updateTimerState({ totalRemaining: 0 }));

    expect(store.getState().blockedSites.isInWorkingSession).toBe(false);
  });
});
