import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { SettingsClient, SettingsSnapshot } from '@/runtime';
import settingsProjectionReducer from './reducers/settingsProjectionReducer';
import { resetSettingsConnectionManagerForTests } from './settingsConnectionManager';
import {
  resetSettingsProjectionSubscriptionForTests,
  startSettingsProjectionSubscription,
} from './settingsProjectionSubscription';

const snapshot: SettingsSnapshot = {
  schemaVersion: 1,
  revision: 3,
  value: {
    themePreference: 'dark',
    workHours: [],
    blockedSites: [],
    hasOnboarded: false,
    quiz: {
      currentQuestionId: 'Q1',
      selectedChoices: [],
      isComplete: false,
      results: null,
    },
  },
};

const createMockClient = (): SettingsClient & { subscribe: ReturnType<typeof vi.fn> } => {
  const listeners = new Set<(value: SettingsSnapshot) => void>();
  const subscribe = vi.fn((listener: (value: SettingsSnapshot) => void) => {
    listeners.add(listener);
    listener(snapshot);
    return () => listeners.delete(listener);
  });
  return {
    current: vi.fn(async () => ({ ok: true as const, value: snapshot })),
    command: vi.fn(),
    setThemePreference: vi.fn(),
    subscribe,
  };
};

describe('settings projection subscription', () => {
  it('registers only one application-level subscription', async () => {
    resetSettingsProjectionSubscriptionForTests();
    resetSettingsConnectionManagerForTests();
    const store = configureStore({ reducer: { settingsProjection: settingsProjectionReducer } });
    const client = createMockClient();

    startSettingsProjectionSubscription({ client, dispatch: store.dispatch });
    startSettingsProjectionSubscription({ client, dispatch: store.dispatch });

    await vi.waitFor(() => {
      expect(client.subscribe).toHaveBeenCalledTimes(1);
    });
    expect(store.getState().settingsProjection.themePreference).toBe('dark');
  });
});
