import { DEFAULT_BLOCK_LIST_ENTRIES } from '@/Shared/Constants/Constants';
import type { BlockListEntry } from '@/Shared/Types/AppState';
import { normalizeBlockListEntry } from '@/Shared/Utils/normalizeBlockListEntry';

export const createDefaultBlockList = (): BlockListEntry[] =>
  DEFAULT_BLOCK_LIST_ENTRIES.map((url) => ({ url, isBlocked: false }));

export const addBlockListEntry = (blockList: BlockListEntry[], input: string): BlockListEntry[] => {
  const url = normalizeBlockListEntry(input);

  if (!url || blockList.some((entry) => entry.url === url)) {
    return blockList;
  }

  return [...blockList, { url, isBlocked: false }].sort((left, right) =>
    left.url.localeCompare(right.url)
  );
};

export const removeBlockListEntry = (blockList: BlockListEntry[], input: string): BlockListEntry[] => {
  const url = normalizeBlockListEntry(input);

  if (!url) {
    return blockList;
  }

  return blockList.filter((entry) => entry.url !== url);
};
