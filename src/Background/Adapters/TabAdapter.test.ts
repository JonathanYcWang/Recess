import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllTabs, removeTabById } from '@/Background/Adapters/TabAdapter';

const tabQuery = vi.hoisted(() => vi.fn());
const tabRemove = vi.hoisted(() => vi.fn());

vi.mock('webextension-polyfill', () => ({
  default: {
    tabs: {
      query: tabQuery,
      remove: tabRemove,
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('getAllTabs', () => {
  it('queries all tabs via the browser polyfill', async () => {
    const tabs = [{ id: 1, url: 'https://example.com' }];
    tabQuery.mockResolvedValue(tabs);

    await expect(getAllTabs()).resolves.toEqual(tabs);
    expect(tabQuery).toHaveBeenCalledWith({});
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
