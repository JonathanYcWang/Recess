import type {
  BrowserActivityAdapter,
  BrowserActivityResult,
  BrowserActivityState,
  BrowserActivityTab,
} from './types';

export interface InMemoryBrowserActivityState {
  focusedWindowId: number | null;
  tabs: BrowserActivityTab[];
}

export const createInMemoryBrowserActivityState = (): InMemoryBrowserActivityState => ({
  focusedWindowId: null,
  tabs: [],
});

export const createInMemoryBrowserActivityAdapter = (
  state: InMemoryBrowserActivityState,
  options?: { unavailable?: boolean }
): BrowserActivityAdapter => {
  const listeners = new Set<(state: BrowserActivityState) => void>();

  const snapshot = (): BrowserActivityState => {
    const activeTab =
      state.tabs.find(
        (tab) =>
          tab.active && tab.windowId === state.focusedWindowId && state.focusedWindowId !== null
      ) ?? null;
    return {
      focusedWindowId: state.focusedWindowId,
      activeTab,
    };
  };

  const notify = () => {
    const current = snapshot();
    for (const listener of listeners) {
      listener(current);
    }
  };

  return {
    async queryState(): Promise<BrowserActivityResult<BrowserActivityState>> {
      if (options?.unavailable) {
        return { ok: false, error: { kind: 'unavailable' } };
      }
      return { ok: true, value: snapshot() };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Test helpers exposed via casting in tests
    ...(process.env.NODE_ENV === 'test'
      ? {
          __notifyForTests: notify,
          __setFocusedWindowForTests: (windowId: number | null) => {
            state.focusedWindowId = windowId;
            notify();
          },
        }
      : {}),
  };
};

export type {
  BrowserActivityAdapter,
  BrowserActivityError,
  BrowserActivityResult,
  BrowserActivityState,
  BrowserActivityTab,
} from './types';
