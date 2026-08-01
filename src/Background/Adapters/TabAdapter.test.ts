import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllTabs, hostnameFromTabUrl, removeTabById } from '@/Background/Adapters/TabAdapter';

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

describe('hostnameFromTabUrl', () => {
  it('returns a normalized hostname for a tab URL', () => {
    expect(hostnameFromTabUrl('https://www.youtube.com/watch?v=1')).toBe('www.youtube.com');
  });

  it('returns null when the URL is missing', () => {
    expect(hostnameFromTabUrl(undefined)).toBeNull();
  });

  it('returns null for internal browser URLs', () => {
    expect(hostnameFromTabUrl('chrome://newtab/')).toBeNull();
    expect(hostnameFromTabUrl('about:blank')).toBeNull();
  });

  it('returns null for unparseable URLs', () => {
    expect(hostnameFromTabUrl('not a url')).toBeNull();
  });
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
