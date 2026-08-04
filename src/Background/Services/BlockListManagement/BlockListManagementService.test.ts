import { describe, expect, it, vi } from 'vitest';

vi.mock('webextension-polyfill', () => ({
  default: {
    tabs: { query: vi.fn(), remove: vi.fn(), onUpdated: { addListener: vi.fn() } },
    runtime: { sendMessage: vi.fn() },
  },
}));

import {
  addBlockListEntry,
  createDefaultBlockList,
  removeBlockListEntry,
} from '@/Background/Services/BlockListManagement/BlockListManagementService';

describe('addBlockListEntry', () => {
  it('adds a normalized hostname and keeps the list sorted', () => {
    expect(addBlockListEntry([{ url: 'youtube.com', isBlocked: false }], 'Instagram.com')).toEqual([
      { url: 'instagram.com', isBlocked: false },
      { url: 'youtube.com', isBlocked: false },
    ]);
  });

  it('returns the same list for duplicates and invalid input', () => {
    const blockList = createDefaultBlockList().slice(0, 1);

    expect(addBlockListEntry(blockList, 'youtube.com')).toBe(blockList);
    expect(addBlockListEntry(blockList, 'not a url')).toBe(blockList);
  });
});

describe('removeBlockListEntry', () => {
  it('removes a normalized hostname', () => {
    const blockList = [
      { url: 'instagram.com', isBlocked: true },
      { url: 'youtube.com', isBlocked: true },
    ];

    expect(removeBlockListEntry(blockList, 'https://youtube.com/')).toEqual([
      { url: 'instagram.com', isBlocked: true },
    ]);
  });
});
