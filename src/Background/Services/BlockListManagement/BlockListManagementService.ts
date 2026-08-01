import { DEFAULT_BLOCK_LIST_ENTRIES } from '@/Shared/Constants/Constants';
import { normalizeBlockListEntry } from '@/Background/Utils/normalizeBlockListEntry';

export type BlockListValue = {
  entries: string[];
};

export type BlockListDecision = { outcome: 'allow' } | { outcome: 'block'; entry: string };

export const createDefaultBlockListValue = (): BlockListValue => ({
  entries: [...DEFAULT_BLOCK_LIST_ENTRIES],
});

export const addBlockListEntry = (value: BlockListValue, input: string): BlockListValue => {
  const entry = normalizeBlockListEntry(input);

  if (!entry || value.entries.includes(entry)) {
    return value;
  }

  return { entries: [...value.entries, entry].sort() };
};

export const removeBlockListEntry = (value: BlockListValue, input: string): BlockListValue => {
  const entry = normalizeBlockListEntry(input);

  if (!entry) {
    return value;
  }

  return { entries: value.entries.filter((current) => current !== entry) };
};

export const hostnameMatchesBlockListEntry = (hostname: string, entry: string): boolean => {
  const normalizedHost = normalizeBlockListEntry(hostname);
  const normalizedEntry = normalizeBlockListEntry(entry);

  if (!normalizedHost || !normalizedEntry) {
    return false;
  }

  return normalizedHost === normalizedEntry || normalizedHost.endsWith(`.${normalizedEntry}`);
};

export const decideBlockListAccess = (
  value: BlockListValue,
  hostname: string
): BlockListDecision => {
  const entry = value.entries.find((candidate) =>
    hostnameMatchesBlockListEntry(hostname, candidate)
  );

  return entry ? { outcome: 'block', entry } : { outcome: 'allow' };
};
