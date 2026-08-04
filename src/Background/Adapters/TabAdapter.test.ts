import { afterEach, describe, expect, it, vi } from 'vitest';
import { SCHEDULER_PHASE } from '@/Shared/Constants/Constants';
import { createDefaultPersistedAppState } from '@/Shared/State/defaults';
import {
  getAllTabs,
  registerBlockedTabEnforcementOnTabUpdates,
  removeTabById,
} from '@/Background/Adapters/TabAdapter';

const tabQuery = vi.hoisted(() => vi.fn());
const tabRemove = vi.hoisted(() => vi.fn());
const onUpdatedAddListener = vi.hoisted(() => vi.fn());
const readAppState = vi.hoisted(() => vi.fn());

vi.mock('webextension-polyfill', () => ({
  default: {
    tabs: {
      query: tabQuery,
      remove: tabRemove,
      onUpdated: {
        addListener: onUpdatedAddListener,
      },
    },
  },
}));

vi.mock('@/Background/Repositories/StorageRepository', () => ({
  storageRepository: {
    readAppState,
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('getAllTabs', () => {
  it('queries all tabs via the browser polyfill', async () => {
    const tabs = [
      { id: 1, url: 'https://example.com' },
      { id: undefined, url: 'https://ignored.com' },
      { id: 2, url: 'https://other.com' },
    ];
    tabQuery.mockResolvedValue(tabs);

    await expect(getAllTabs()).resolves.toEqual(tabs);
    expect(tabQuery).toHaveBeenCalledWith({});
  });
});

describe('registerBlockedTabEnforcementOnTabUpdates', () => {
  it('closes the tab when policy blocks the updated URL', async () => {
    readAppState.mockResolvedValue({
      ...createDefaultPersistedAppState(),
      blockList: [{ url: 'youtube.com', isBlocked: true }],
      scheduler: {
        ...createDefaultPersistedAppState().scheduler,
        activePhase: SCHEDULER_PHASE.FOCUS_BLOCK,
      },
    });
    tabRemove.mockResolvedValue(undefined);

    registerBlockedTabEnforcementOnTabUpdates();

    const listener = onUpdatedAddListener.mock.calls[0]?.[0];
    await listener(7, { url: 'https://www.youtube.com/', status: 'complete' });

    expect(tabRemove).toHaveBeenCalledWith(7);
  });

  it('ignores updates without a URL', async () => {
    registerBlockedTabEnforcementOnTabUpdates();

    const listener =
      onUpdatedAddListener.mock.calls[onUpdatedAddListener.mock.calls.length - 1]?.[0];
    listener(7, { status: 'loading' });

    await Promise.resolve();

    expect(readAppState).not.toHaveBeenCalled();
  });
});

describe('removeTabById', () => {
  it('removes the tab by id', async () => {
    tabRemove.mockResolvedValue(undefined);

    await removeTabById(42);

    expect(tabRemove).toHaveBeenCalledWith(42);
  });

  it('does not throw when removal fails', async () => {
    tabRemove.mockRejectedValue(new Error('No tab with id: 99'));

    await expect(removeTabById(99)).resolves.toBeUndefined();
  });
});
