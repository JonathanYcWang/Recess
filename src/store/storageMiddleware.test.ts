import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SESSION_STATES } from '../constants/constants';
import { setBlockedSites } from './actions/blockedSitesActions';
import { setQuizState } from './actions/quizActions';
import { setHasOnboarded } from './actions/routingActions';
import { setTotalTimer } from './actions/timerActions';
import { setWorkHours } from './actions/workHoursActions';
import blockedSitesReducer from './reducers/blockedSitesReducer';
import quizReducer from './reducers/quizReducer';
import routingReducer from './reducers/routingReducer';
import timerReducer from './reducers/timerReducer';
import workHoursReducer from './reducers/workHoursReducer';
import {
  createInitialBlockedSitesState,
  createInitialQuizState,
  createInitialRoutingState,
  createInitialTimerState,
  createInitialWorkHoursState,
} from './initialState';
import { loadStateFromStorage, seedInitialStateInStorage, storageMiddleware } from './storageMiddleware';

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
    store.dispatch(setBlockedSites(['news.example']));
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
            blockedSites: { sites: ['news.example'] },
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
      blockedSites: ['news.example'],
      routing: true,
      quiz: {
        currentQuestionId: 'Q1',
        selectedChoices: [],
        isComplete: false,
        results: null,
      },
    });
  });

  it('seeds missing initial state to chrome storage', async () => {
    const values: Record<string, unknown> = {};
    const chromeStorage = {
      get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const key = keys[0];
        callback({ [key]: values[key] });
      }),
      set: vi.fn((value: Record<string, unknown>, callback: () => void) => {
        Object.assign(values, value);
        callback();
      }),
      remove: vi.fn(),
    };
    vi.stubGlobal('chrome', { storage: { local: chromeStorage } });

    await seedInitialStateInStorage();

    expect(values).toEqual({
      timerState: createInitialTimerState(),
      workHours: createInitialWorkHoursState().entries,
      blockedSites: createInitialBlockedSitesState(),
      hasOnboarded: createInitialRoutingState().hasOnboarded,
      quizState: createInitialQuizState(),
    });
  });

  it('does not overwrite existing chrome storage values while seeding', async () => {
    const existingTimer = {
      sessionState: SESSION_STATES.ONGOING_FOCUS_SESSION,
      totalRemaining: 120,
    };
    const values: Record<string, unknown> = {
      timerState: existingTimer,
      blockedSites: ['news.example'],
    };
    const chromeStorage = {
      get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const key = keys[0];
        callback({ [key]: values[key] });
      }),
      set: vi.fn((value: Record<string, unknown>, callback: () => void) => {
        Object.assign(values, value);
        callback();
      }),
      remove: vi.fn(),
    };
    vi.stubGlobal('chrome', { storage: { local: chromeStorage } });

    await seedInitialStateInStorage();

    expect(values.timerState).toBe(existingTimer);
    expect(values.blockedSites).toEqual(['news.example']);
    expect(values.workHours).toEqual(createInitialWorkHoursState().entries);
    expect(values.hasOnboarded).toBe(createInitialRoutingState().hasOnboarded);
    expect(values.quizState).toEqual(createInitialQuizState());
    expect(chromeStorage.set).not.toHaveBeenCalledWith(
      { timerState: expect.anything() },
      expect.any(Function)
    );
    expect(chromeStorage.set).not.toHaveBeenCalledWith(
      { blockedSites: expect.anything() },
      expect.any(Function)
    );
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

});
