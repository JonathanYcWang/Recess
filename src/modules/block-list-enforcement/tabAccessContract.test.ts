import { describe, expect, it } from 'vitest';
import {
  addInMemoryTab,
  createInMemoryTabAccess,
  createInMemoryTabAccessState,
} from './inMemoryTabAccess';
import type { TabAccess } from './types';

export const describeTabAccessContractTests = (
  suiteName: string,
  createTabAccess: () => TabAccess
): void => {
  describe(`tab access contract (${suiteName})`, () => {
    it('returns a queryable tab access adapter', async () => {
      const tabAccess = createTabAccess();
      const result = await tabAccess.queryEligibleTabs();
      expect(result.ok).toBe(true);
    });

    it('queries only eligible normal tabs', async () => {
      const state = createInMemoryTabAccessState();
      addInMemoryTab(state, {
        url: 'https://example.com',
        active: true,
        incognito: false,
      });
      addInMemoryTab(state, {
        url: 'https://private.test',
        active: true,
        incognito: true,
      });
      addInMemoryTab(state, {
        url: 'chrome-extension://abc/page.html',
        active: false,
        incognito: false,
      });
      const tabAccess = createInMemoryTabAccess(state);
      const result = await tabAccess.queryEligibleTabs();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.url).toBe('https://example.com');
      }
    });

    it('closes only requested tabs and records closed identities', async () => {
      const state = createInMemoryTabAccessState();
      const first = addInMemoryTab(state, {
        url: 'https://a.test',
        active: true,
        incognito: false,
      });
      addInMemoryTab(state, {
        url: 'https://b.test',
        active: false,
        incognito: false,
      });
      const tabAccess = createInMemoryTabAccess(state);
      const result = await tabAccess.closeTabs([first]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.closed).toEqual([{ tabId: first.tabId, url: 'https://a.test' }]);
        expect(result.value.failed).toEqual([]);
      }
      const remaining = await tabAccess.queryEligibleTabs();
      expect(remaining.ok).toBe(true);
      if (remaining.ok) {
        expect(remaining.value).toHaveLength(1);
      }
    });

    it('preserves duplicate URL multiplicity in remembered ownership', async () => {
      const state = createInMemoryTabAccessState();
      const first = addInMemoryTab(state, {
        url: 'https://dup.test',
        active: true,
        incognito: false,
      });
      const second = addInMemoryTab(state, {
        url: 'https://dup.test',
        active: false,
        incognito: false,
      });
      const tabAccess = createInMemoryTabAccess(state);
      const closed = await tabAccess.closeTabs([first, second]);
      expect(closed.ok).toBe(true);
      if (closed.ok) {
        expect(closed.value.closed.map((tab) => tab.url)).toEqual([
          'https://dup.test',
          'https://dup.test',
        ]);
      }
    });

    it('opens inactive tabs and does not promise window state', async () => {
      const state = createInMemoryTabAccessState();
      const tabAccess = createInMemoryTabAccess(state);
      const opened = await tabAccess.openInactiveTab('https://restore.test');
      expect(opened.ok).toBe(true);
      if (opened.ok) {
        expect(opened.value.url).toBe('https://restore.test');
      }
      const tabs = await tabAccess.queryEligibleTabs();
      expect(tabs.ok).toBe(true);
      if (tabs.ok) {
        expect(tabs.value[0]?.url).toBe('https://restore.test');
      }
    });

    it('reports partial close failures', async () => {
      const state = createInMemoryTabAccessState();
      const tab = addInMemoryTab(state, {
        url: 'https://fail.test',
        active: true,
        incognito: false,
      });
      const tabAccess = createInMemoryTabAccess(state, {
        failCloseTabIds: new Set([tab.tabId]),
      });
      const result = await tabAccess.closeTabs([tab]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('partial-failure');
      }
    });

    it('reports open failures for retry', async () => {
      const state = createInMemoryTabAccessState();
      const tabAccess = createInMemoryTabAccess(state, {
        failOpenUrls: new Set(['https://retry.test']),
      });
      const result = await tabAccess.openInactiveTab('https://retry.test');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('open-failed');
      }
    });
  });
};

describeTabAccessContractTests('in-memory', () => {
  const state = createInMemoryTabAccessState();
  return createInMemoryTabAccess(state);
});
