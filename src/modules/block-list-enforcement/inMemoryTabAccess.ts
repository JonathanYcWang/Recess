import type { TabAccess, TabAccessResult, TabIdentity } from './types';

export interface InMemoryTab extends TabIdentity {
  active: boolean;
  incognito: boolean;
}

export interface InMemoryTabAccessState {
  tabs: InMemoryTab[];
  nextTabId: number;
}

export const createInMemoryTabAccessState = (): InMemoryTabAccessState => ({
  tabs: [],
  nextTabId: 1,
});

const isInternalUrl = (url: string): boolean => {
  try {
    const protocol = new URL(url).protocol.toLowerCase();
    return (
      protocol === 'chrome-extension:' ||
      protocol === 'safari-web-extension:' ||
      protocol === 'about:' ||
      protocol === 'chrome:'
    );
  } catch {
    return true;
  }
};

export const createInMemoryTabAccess = (
  state: InMemoryTabAccessState,
  options?: {
    unavailable?: boolean;
    failCloseTabIds?: Set<number>;
    failOpenUrls?: Set<string>;
  }
): TabAccess => ({
  async queryEligibleTabs(): Promise<TabAccessResult<TabIdentity[]>> {
    if (options?.unavailable) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    return {
      ok: true,
      value: state.tabs
        .filter((tab) => !tab.incognito && !isInternalUrl(tab.url))
        .map(({ tabId, url }) => ({ tabId, url })),
    };
  },

  async closeTabs(tabs) {
    if (options?.unavailable) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    const closed: TabIdentity[] = [];
    const failed: number[] = [];
    for (const tab of tabs) {
      if (options?.failCloseTabIds?.has(tab.tabId)) {
        failed.push(tab.tabId);
        continue;
      }
      const index = state.tabs.findIndex((candidate) => candidate.tabId === tab.tabId);
      if (index === -1) {
        failed.push(tab.tabId);
        continue;
      }
      state.tabs.splice(index, 1);
      closed.push({ tabId: tab.tabId, url: tab.url });
    }
    if (failed.length > 0 && closed.length === 0) {
      return { ok: false, error: { kind: 'partial-failure', failedTabIds: failed } };
    }
    return { ok: true, value: { closed, failed } };
  },

  async openInactiveTab(url) {
    if (options?.unavailable) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    if (options?.failOpenUrls?.has(url)) {
      return { ok: false, error: { kind: 'open-failed', url } };
    }
    const tabId = state.nextTabId++;
    state.tabs.push({ tabId, url, active: false, incognito: false });
    return { ok: true, value: { tabId, url } };
  },
});

export const addInMemoryTab = (
  state: InMemoryTabAccessState,
  tab: Omit<InMemoryTab, 'tabId'> & { tabId?: number }
): InMemoryTab => {
  const created: InMemoryTab = {
    tabId: tab.tabId ?? state.nextTabId++,
    url: tab.url,
    active: tab.active,
    incognito: tab.incognito,
  };
  state.tabs.push(created);
  return created;
};
