import type {
  BrowserActivityAdapter,
  BrowserActivityResult,
  BrowserActivityState,
} from '@/modules/browser-activity/types';

const mapLastError = (): import('@/modules/browser-activity/types').BrowserActivityError => {
  const message = chrome.runtime.lastError?.message ?? '';
  if (message.includes('permission')) {
    return { kind: 'permission-denied' };
  }
  return { kind: 'unavailable' };
};

const isInspectableUrl = (url: string | undefined): url is string => {
  if (!url) {
    return false;
  }
  try {
    const protocol = new URL(url).protocol.toLowerCase();
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export const createChromiumBrowserActivityAdapter = (): BrowserActivityAdapter => {
  const listeners = new Set<(state: BrowserActivityState) => void>();
  let lastState: BrowserActivityState = { focusedWindowId: null, activeTab: null };

  const queryState = async (): Promise<BrowserActivityResult<BrowserActivityState>> => {
    try {
      const focusedWindow = await chrome.windows.getLastFocused({ populate: true });
      const focusedWindowId = focusedWindow.id ?? null;
      const activeTab = (focusedWindow.tabs ?? []).find(
        (tab) => tab.active && tab.id !== undefined && !tab.incognito && isInspectableUrl(tab.url)
      );
      const state: BrowserActivityState = {
        focusedWindowId,
        activeTab: activeTab
          ? {
              tabId: activeTab.id as number,
              windowId: activeTab.windowId as number,
              url: activeTab.url as string,
              active: true,
            }
          : null,
      };
      lastState = state;
      return { ok: true, value: state };
    } catch {
      return { ok: false, error: mapLastError() };
    }
  };

  const publish = async () => {
    const state = await queryState();
    if (!state.ok) {
      return;
    }
    lastState = state.value;
    for (const listener of listeners) {
      listener(state.value);
    }
  };

  chrome.windows.onFocusChanged.addListener(() => {
    void publish();
  });
  chrome.tabs.onActivated.addListener(() => {
    void publish();
  });
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
      void publish();
    }
  });
  chrome.tabs.onRemoved.addListener(() => {
    void publish();
  });

  return {
    queryState,
    subscribe(listener) {
      listeners.add(listener);
      listener(lastState);
      return () => listeners.delete(listener);
    },
  };
};
