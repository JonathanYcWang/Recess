import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChromiumTabAccessAdapter } from './chromiumTabAccessAdapter';
import { createSafariCompatibleTabAccessAdapter } from '../safari/safariTabAccessAdapter';

describe('chromium tab access adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const setupChromeTabs = () => {
    const tabs: Array<{
      id?: number;
      url?: string;
      incognito?: boolean;
      active?: boolean;
    }> = [];
    let nextId = 1;

    vi.stubGlobal('chrome', {
      tabs: {
        query: vi.fn(async () => tabs),
        remove: vi.fn(async (tabId: number) => {
          const index = tabs.findIndex((tab) => tab.id === tabId);
          if (index === -1) {
            throw new Error('No tab with id');
          }
          tabs.splice(index, 1);
        }),
        create: vi.fn(async (props: { url?: string; active?: boolean }) => {
          const tab = {
            id: nextId++,
            url: props.url,
            active: props.active ?? true,
            incognito: false,
          };
          tabs.push(tab);
          return tab;
        }),
      },
      runtime: { lastError: undefined },
    });

    return tabs;
  };

  it('queries only eligible normal tabs', async () => {
    const tabs = setupChromeTabs();
    tabs.push(
      { id: 1, url: 'https://example.com', incognito: false },
      { id: 2, url: 'https://private.test', incognito: true },
      { id: 3, url: 'chrome-extension://abc/page.html', incognito: false }
    );

    const tabAccess = createChromiumTabAccessAdapter();
    const result = await tabAccess.queryEligibleTabs();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.url).toBe('https://example.com');
    }
  });

  it('closes requested tabs', async () => {
    const tabs = setupChromeTabs();
    tabs.push(
      { id: 1, url: 'https://a.test', incognito: false },
      { id: 2, url: 'https://b.test', incognito: false }
    );

    const tabAccess = createChromiumTabAccessAdapter();
    const result = await tabAccess.closeTabs([{ tabId: 1, url: 'https://a.test' }]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.closed).toHaveLength(1);
      expect(result.value.failed).toEqual([]);
    }
    const remaining = await tabAccess.queryEligibleTabs();
    expect(remaining.ok).toBe(true);
    if (remaining.ok) {
      expect(remaining.value).toHaveLength(1);
      expect(remaining.value[0]?.url).toBe('https://b.test');
    }
  });

  it('opens inactive tabs', async () => {
    setupChromeTabs();
    const tabAccess = createChromiumTabAccessAdapter();
    const opened = await tabAccess.openInactiveTab('https://restore.test');

    expect(opened.ok).toBe(true);
    if (opened.ok) {
      expect(opened.value.url).toBe('https://restore.test');
    }
  });
});

describe('safari tab access adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when chrome.tabs is unavailable', () => {
    vi.stubGlobal('chrome', undefined);
    expect(createSafariCompatibleTabAccessAdapter()).toBeNull();
  });

  it('delegates to chromium adapter when tabs API exists', () => {
    vi.stubGlobal('chrome', { tabs: {}, runtime: { lastError: undefined } });
    expect(createSafariCompatibleTabAccessAdapter()).not.toBeNull();
  });
});
