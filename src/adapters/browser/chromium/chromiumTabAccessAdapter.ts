import type { TabAccess, TabAccessResult, TabIdentity } from '@/modules/block-list-enforcement';

const isInternalUrl = (url: string | undefined): boolean => {
  if (!url) {
    return true;
  }
  try {
    const protocol = new URL(url).protocol.toLowerCase();
    return (
      protocol === 'chrome-extension:' ||
      protocol === 'chrome:' ||
      protocol === 'about:' ||
      protocol === 'edge:'
    );
  } catch {
    return true;
  }
};

const mapLastError = (): import('@/modules/block-list-enforcement').TabAccessError => {
  const message = chrome.runtime.lastError?.message ?? '';
  if (message.includes('No tab with id')) {
    return { kind: 'invalid-tab' };
  }
  if (message.includes('cannot be edited')) {
    return { kind: 'permission-denied' };
  }
  return { kind: 'unavailable' };
};

export const createChromiumTabAccessAdapter = (): TabAccess => ({
  async queryEligibleTabs(): Promise<TabAccessResult<TabIdentity[]>> {
    try {
      const tabs = await chrome.tabs.query({});
      return {
        ok: true,
        value: tabs
          .filter(
            (tab) => tab.id !== undefined && tab.url && !tab.incognito && !isInternalUrl(tab.url)
          )
          .map((tab) => ({ tabId: tab.id as number, url: tab.url as string })),
      };
    } catch {
      return { ok: false, error: mapLastError() };
    }
  },

  async closeTabs(tabs) {
    const closed: TabIdentity[] = [];
    const failed: number[] = [];
    for (const tab of tabs) {
      try {
        await chrome.tabs.remove(tab.tabId);
        closed.push(tab);
      } catch {
        failed.push(tab.tabId);
      }
    }
    if (failed.length > 0 && closed.length === 0) {
      return { ok: false, error: { kind: 'partial-failure', failedTabIds: failed } };
    }
    return { ok: true, value: { closed, failed } };
  },

  async openInactiveTab(url) {
    try {
      const created = await chrome.tabs.create({ url, active: false });
      if (!created.id) {
        return { ok: false, error: { kind: 'open-failed', url } };
      }
      return { ok: true, value: { tabId: created.id, url } };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: 'open-failed',
          url,
          cause: error instanceof Error ? error.message : undefined,
        },
      };
    }
  },
});
