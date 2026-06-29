export type BlockListValue = {
  entries: string[];
};

export type BlockListDecision = { outcome: 'allow' } | { outcome: 'block'; entry: string };

const DEFAULT_ENTRIES = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'messenger.com',
  'web.whatsapp.com',
  'discord.com',
  'tiktok.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'reddit.com',
];

export const createDefaultBlockListValue = (): BlockListValue => ({
  entries: [...DEFAULT_ENTRIES],
});

export const normalizeBlockListEntry = (input: string): string | null => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/\.$/, '');
    return host.includes('.') ? host : null;
  } catch {
    return null;
  }
};

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
