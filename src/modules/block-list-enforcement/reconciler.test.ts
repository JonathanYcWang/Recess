import { describe, expect, it } from 'vitest';
import {
  addInMemoryTab,
  createBlockListReconciler,
  createInMemoryOwnershipStore,
  createInMemoryTabAccess,
  createInMemoryTabAccessState,
} from './index';
import type { AccessSnapshot } from './types';

const focusSnapshot = (entries: string[]): AccessSnapshot => ({
  revision: 1,
  blockListEntries: entries,
  accessContext: {
    phase: 'focus-block',
    blockListEntries: entries,
    recessPassEntry: null,
    hallPassEntry: null,
  },
  remembered: { rememberedUrls: [] },
});

describe('createBlockListReconciler', () => {
  it('closes matching tabs and remembers URL multiplicity before close', async () => {
    const state = createInMemoryTabAccessState();
    addInMemoryTab(state, { url: 'https://blocked.test/path', active: true, incognito: false });
    addInMemoryTab(state, { url: 'https://blocked.test/other', active: false, incognito: false });
    addInMemoryTab(state, { url: 'https://allowed.test', active: true, incognito: false });
    const ownershipStore = createInMemoryOwnershipStore();
    const reconciler = createBlockListReconciler({
      tabAccess: createInMemoryTabAccess(state),
      ownershipStore,
    });

    const result = await reconciler.reconcile(focusSnapshot(['blocked.test']));
    expect(result).toEqual({ kind: 'converged', closed: 2, restored: 0, blockedAttempts: [] });
    const remembered = await ownershipStore.read();
    expect(remembered.rememberedUrls).toEqual([
      'https://blocked.test/path',
      'https://blocked.test/other',
    ]);
    const tabs = await createInMemoryTabAccess(state).queryEligibleTabs();
    expect(tabs.ok).toBe(true);
    if (tabs.ok) {
      expect(tabs.value.map((tab) => tab.url)).toEqual(['https://allowed.test']);
    }
  });

  it('restores remembered URLs when policy allows', async () => {
    const state = createInMemoryTabAccessState();
    const ownershipStore = createInMemoryOwnershipStore({
      rememberedUrls: ['https://blocked.test/a', 'https://blocked.test/b'],
    });
    const reconciler = createBlockListReconciler({
      tabAccess: createInMemoryTabAccess(state),
      ownershipStore,
    });

    const result = await reconciler.reconcile({
      revision: 2,
      blockListEntries: ['blocked.test'],
      accessContext: {
        phase: 'work-session-ended',
        blockListEntries: ['blocked.test'],
        recessPassEntry: null,
        hallPassEntry: null,
      },
      remembered: { rememberedUrls: [] },
    });
    expect(result).toEqual({ kind: 'converged', closed: 0, restored: 2, blockedAttempts: [] });
    const remembered = await ownershipStore.read();
    expect(remembered.rememberedUrls).toEqual([]);
  });

  it('coalesces concurrent reconciliation to the latest snapshot', async () => {
    const state = createInMemoryTabAccessState();
    addInMemoryTab(state, { url: 'https://blocked.test', active: true, incognito: false });
    const ownershipStore = createInMemoryOwnershipStore();
    const reconciler = createBlockListReconciler({
      tabAccess: createInMemoryTabAccess(state),
      ownershipStore,
    });

    const first = reconciler.reconcile(focusSnapshot(['blocked.test']));
    const second = reconciler.reconcile(focusSnapshot(['blocked.test']));
    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult.kind).toBe('converged');
    expect(secondResult.kind).toBe('converged');
    const tabs = await createInMemoryTabAccess(state).queryEligibleTabs();
    expect(tabs.ok).toBe(true);
    if (tabs.ok) {
      expect(tabs.value).toHaveLength(0);
    }
  });
});
