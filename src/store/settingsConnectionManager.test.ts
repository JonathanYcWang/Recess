import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';
import {
  createInProcessRuntimeTransport,
  createMessagingSettingsClient,
} from '@/runtime/client/messagingSettingsClient';
import type { SettingsClient, SettingsSnapshot } from '@/runtime';
import settingsProjectionReducer from './reducers/settingsProjectionReducer';
import {
  resetSettingsConnectionManagerForTests,
  SettingsConnectionManager,
  startSettingsConnectionManager,
} from './settingsConnectionManager';
import { createConnectionAwareSettingsClient } from './settingsConnectionAwareClient';
import { resetAppSettingsClientForTests } from './settingsClient';

const snapshot = (revision: number, theme: 'light' | 'dark' = 'light'): SettingsSnapshot => ({
  schemaVersion: 1,
  revision,
  value: {
    themePreference: theme,
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
});

const createTestClient = async (options?: {
  current?: SettingsClient['current'];
  onSubscribe?: (
    listener: (value: SettingsSnapshot) => void,
    options?: Parameters<SettingsClient['subscribe']>[1]
  ) => () => void;
}) => {
  const root = await createBackgroundCompositionRoot({
    adapter: createInMemoryKeyValueAdapter(),
  });
  if (!root.ok) {
    throw new Error('expected runtime initialization');
  }
  const base = createMessagingSettingsClient(createInProcessRuntimeTransport(root.value.handler));
  if (options?.current) {
    base.current = options.current;
  }
  if (options?.onSubscribe) {
    const originalSubscribe = base.subscribe.bind(base);
    base.subscribe = (listener, subscribeOptions) => {
      if (options.onSubscribe) {
        return options.onSubscribe(listener, subscribeOptions);
      }
      return originalSubscribe(listener, subscribeOptions);
    };
  }
  return createConnectionAwareSettingsClient(base);
};

describe('SettingsConnectionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSettingsConnectionManagerForTests();
    resetAppSettingsClientForTests();
  });

  afterEach(() => {
    resetSettingsConnectionManagerForTests();
    vi.useRealTimers();
  });

  const createStore = () =>
    configureStore({ reducer: { settingsProjection: settingsProjectionReducer } });

  it('marks disconnected on initial transport failure while keeping the last projection', async () => {
    const store = createStore();
    store.dispatch({
      type: 'settingsProjection/setProjection',
      payload: { revision: 1, themePreference: 'dark' },
    });
    const client = await createTestClient({
      current: async () => ({ ok: false, error: { kind: 'missing-receiver' } }),
    });

    const manager = new SettingsConnectionManager({
      client,
      dispatch: store.dispatch,
      backoffMs: [100],
    });
    manager.start();
    await vi.runAllTimersAsync();

    expect(store.getState().settingsProjection.connectionState).toBe('disconnected');
    expect(store.getState().settingsProjection.revision).toBe(1);
    expect(store.getState().settingsProjection.themePreference).toBe('dark');
  });

  it('rejects commands while disconnected', async () => {
    const store = createStore();
    const client = await createTestClient({
      current: async () => ({ ok: false, error: { kind: 'missing-receiver' } }),
    });
    const manager = startSettingsConnectionManager({
      client,
      dispatch: store.dispatch,
      backoffMs: [100],
    });
    await vi.runAllTimersAsync();

    const result = await client.setThemePreference('dark');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('transport-unavailable');
    }
    manager.stop();
  });

  it('recovers by fetching current before resubscribing', async () => {
    const store = createStore();
    let currentRevision = 2;
    let subscribeCount = 0;
    const client = await createTestClient({
      current: async () => ({ ok: true, value: snapshot(currentRevision, 'dark') }),
      onSubscribe: (listener) => {
        subscribeCount += 1;
        listener(snapshot(currentRevision, 'dark'));
        return () => undefined;
      },
    });

    const manager = new SettingsConnectionManager({ client, dispatch: store.dispatch });
    manager.start();
    await vi.runAllTimersAsync();

    expect(store.getState().settingsProjection.revision).toBe(2);
    expect(store.getState().settingsProjection.connectionState).toBe('connected');
    expect(subscribeCount).toBe(1);

    currentRevision = 5;
    manager.markDisconnected();
    expect(store.getState().settingsProjection.connectionState).toBe('disconnected');
    expect(store.getState().settingsProjection.revision).toBe(2);

    await manager.retryNow();
    expect(store.getState().settingsProjection.revision).toBe(5);
    expect(store.getState().settingsProjection.connectionState).toBe('connected');
    expect(subscribeCount).toBe(2);
    manager.stop();
  });

  it('uses bounded backoff without concurrent retry storms', async () => {
    const store = createStore();
    let currentCalls = 0;
    const client = await createTestClient({
      current: async () => {
        currentCalls += 1;
        return { ok: false, error: { kind: 'missing-receiver' } };
      },
    });
    const manager = new SettingsConnectionManager({
      client,
      dispatch: store.dispatch,
      backoffMs: [100, 200],
    });
    manager.start();
    await vi.runAllTimersAsync();
    const callsAfterInitial = currentCalls;

    void manager.retryNow();
    void manager.retryNow();
    await vi.runAllTimersAsync();

    expect(currentCalls - callsAfterInitial).toBe(1);
    manager.stop();
  });

  it('marks disconnected when transport is lost mid-session', async () => {
    const store = createStore();
    let transportLoss: (() => void) | undefined;
    const client = await createTestClient({
      current: async () => ({ ok: true, value: snapshot(1) }),
      onSubscribe: (listener, subscribeOptions) => {
        transportLoss = subscribeOptions?.onTransportLoss;
        listener(snapshot(1));
        return () => undefined;
      },
    });

    const manager = new SettingsConnectionManager({ client, dispatch: store.dispatch });
    manager.start();
    await vi.runAllTimersAsync();
    transportLoss?.();

    expect(store.getState().settingsProjection.connectionState).toBe('disconnected');
    expect(store.getState().settingsProjection.revision).toBe(1);
    manager.stop();
  });
});
