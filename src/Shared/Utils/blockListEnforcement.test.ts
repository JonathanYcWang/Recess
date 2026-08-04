import { describe, expect, it, vi, afterEach } from 'vitest';
import { SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import { createDefaultPersistedAppState } from '@/Shared/State/defaults';
import type { BlockListEntry, PersistedAppState, Reward } from '@/Shared/Types/AppState';

const tabQuery = vi.hoisted(() => vi.fn());
const tabRemove = vi.hoisted(() => vi.fn());

vi.mock('webextension-polyfill', () => ({
  default: {
    tabs: {
      query: tabQuery,
      remove: tabRemove,
      onUpdated: { addListener: vi.fn() },
    },
    runtime: { sendMessage: vi.fn() },
  },
}));

vi.mock('@/Background/Repositories/StorageRepository', () => ({
  storageRepository: { readAppState: vi.fn() },
}));

import {
  isBlocked,
  applyBlockListEnforcement,
  syncBlockListEnforcementFlags,
  findBlockListEntry,
  normalizeBlockListEntry,
} from '@/Shared/Utils/blockListEnforcement';

afterEach(() => {
  vi.clearAllMocks();
});

const withBlockListContext = (
  blockList: BlockListEntry[],
  activePhase: PersistedAppState['scheduler']['activePhase'],
  selectedRecess: Reward | null
): PersistedAppState => ({
  ...createDefaultPersistedAppState(),
  blockList,
  scheduler: {
    ...createDefaultPersistedAppState().scheduler,
    activePhase,
  },
  recessPicker: {
    ...createDefaultPersistedAppState().recessPicker,
    selectedRecess,
  },
});

describe('syncBlockListEnforcementFlags', () => {
  const entries = [
    { url: 'youtube.com', isBlocked: false },
    { url: 'instagram.com', isBlocked: false },
  ];

  it('clears isBlocked when there is no active phase', () => {
    expect(
      syncBlockListEnforcementFlags(withBlockListContext(entries, null, null)).blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: false },
      { url: 'instagram.com', isBlocked: false },
    ]);
  });

  it('blocks every entry during Focus Block and Reward Game', () => {
    expect(
      syncBlockListEnforcementFlags(
        withBlockListContext(entries, SCHEDULER_PHASE.FOCUS_BLOCK, null)
      ).blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: true },
      { url: 'instagram.com', isBlocked: true },
    ]);
    expect(
      syncBlockListEnforcementFlags(
        withBlockListContext(entries, SCHEDULER_PHASE.REWARD_GAME, null)
      ).blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: true },
      { url: 'instagram.com', isBlocked: true },
    ]);
  });

  it('allows only the selected recess entry during Recess', () => {
    const selectedRecess = { id: '1', name: 'youtube.com', duration: 10 };

    expect(
      syncBlockListEnforcementFlags(
        withBlockListContext(entries, SCHEDULER_PHASE.RECESS, selectedRecess)
      ).blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: false },
      { url: 'instagram.com', isBlocked: true },
    ]);
  });

  it('blocks every entry during Recess when nothing is selected', () => {
    expect(
      syncBlockListEnforcementFlags(withBlockListContext(entries, SCHEDULER_PHASE.RECESS, null))
        .blockList
    ).toEqual([
      { url: 'youtube.com', isBlocked: true },
      { url: 'instagram.com', isBlocked: true },
    ]);
  });

  it('derives flags from scheduler and recess picker on the full state', () => {
    const state = syncBlockListEnforcementFlags({
      ...createDefaultPersistedAppState(),
      scheduler: {
        ...createDefaultPersistedAppState().scheduler,
        activePhase: SCHEDULER_PHASE.FOCUS_BLOCK,
      },
    });

    expect(state.blockList.every((entry) => entry.isBlocked)).toBe(true);
  });
});

describe('applyBlockListEnforcement', () => {
  it('syncs flags and closes tabs that match blocked block-list entries', async () => {
    tabRemove.mockResolvedValue(undefined);
    tabQuery.mockResolvedValue([
      { id: 1, url: 'https://www.youtube.com/watch' },
      { id: 2, url: 'https://example.com/' },
      { id: 3, url: 'https://instagram.com/' },
    ]);

    const result = await applyBlockListEnforcement(
      withBlockListContext(
        [
          { url: 'youtube.com', isBlocked: false },
          { url: 'instagram.com', isBlocked: false },
        ],
        SCHEDULER_PHASE.FOCUS_BLOCK,
        null
      )
    );

    expect(result.blockList).toEqual([
      { url: 'youtube.com', isBlocked: true },
      { url: 'instagram.com', isBlocked: true },
    ]);
    expect(tabRemove).toHaveBeenCalledTimes(2);
    expect(tabRemove).toHaveBeenCalledWith(1);
    expect(tabRemove).toHaveBeenCalledWith(3);
  });

  it('closes only blocked list tabs during Recess', async () => {
    tabRemove.mockResolvedValue(undefined);
    tabQuery.mockResolvedValue([
      { id: 1, url: 'https://www.youtube.com/' },
      { id: 2, url: 'https://instagram.com/' },
    ]);

    await applyBlockListEnforcement(
      withBlockListContext(
        [
          { url: 'youtube.com', isBlocked: false },
          { url: 'instagram.com', isBlocked: false },
        ],
        SCHEDULER_PHASE.RECESS,
        { id: '1', name: 'youtube.com', duration: 10 }
      )
    );

    expect(tabRemove).toHaveBeenCalledTimes(1);
    expect(tabRemove).toHaveBeenCalledWith(2);
  });

  it('does not query or close tabs when there is no active phase', async () => {
    tabQuery.mockResolvedValue([{ id: 1, url: 'https://www.youtube.com/' }]);

    const result = await applyBlockListEnforcement(
      withBlockListContext([{ url: 'youtube.com', isBlocked: true }], null, null)
    );

    expect(result.blockList).toEqual([{ url: 'youtube.com', isBlocked: false }]);
    expect(tabQuery).not.toHaveBeenCalled();
    expect(tabRemove).not.toHaveBeenCalled();
  });
});

describe('normalizeBlockListEntry', () => {
  it('normalizes a full tab URL to a hostname', () => {
    expect(normalizeBlockListEntry('https://www.youtube.com/watch?v=1')).toBe('www.youtube.com');
  });

  it('normalizes bare hostnames for block-list input', () => {
    expect(normalizeBlockListEntry('YouTube.com')).toBe('youtube.com');
  });

  it('returns undefined for empty input', () => {
    expect(normalizeBlockListEntry('')).toBeUndefined();
    expect(normalizeBlockListEntry('   ')).toBeUndefined();
  });

  it('returns undefined for internal browser URLs', () => {
    expect(normalizeBlockListEntry('chrome://newtab/')).toBeUndefined();
    expect(normalizeBlockListEntry('about:blank')).toBeUndefined();
  });

  it('returns undefined for unparseable input', () => {
    expect(normalizeBlockListEntry('not a url')).toBeUndefined();
  });
});

describe('findBlockListEntry', () => {
  const blockList = [{ url: 'youtube.com', isBlocked: true }];

  it('matches exact hostnames and subdomains', () => {
    expect(findBlockListEntry(blockList, 'youtube.com')?.url).toBe('youtube.com');
    expect(findBlockListEntry(blockList, 'www.youtube.com')?.url).toBe('youtube.com');
    expect(findBlockListEntry(blockList, 'evil-youtube.com')).toBeUndefined();
  });

  it('normalizes a tab URL before matching', () => {
    expect(findBlockListEntry(blockList, 'https://www.youtube.com/watch?v=1')?.url).toBe(
      'youtube.com'
    );
  });

  it('returns undefined for unenforceable URLs', () => {
    expect(findBlockListEntry(blockList, 'chrome://newtab/')).toBeUndefined();
  });
});

describe('isBlocked', () => {
  it('derives a single entry flag from phase and recess selection', () => {
    const selectedRecess = { id: '1', name: 'youtube.com', duration: 10 };
    expect(isBlocked('youtube.com', SCHEDULER_PHASE.RECESS, selectedRecess)).toBe(false);
    expect(isBlocked('instagram.com', SCHEDULER_PHASE.RECESS, selectedRecess)).toBe(true);
  });
});
