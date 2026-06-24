export const hostnameMatchesBlockListEntry = (hostname: string, entry: string): boolean => {
  const normalizedHostname = hostname.toLowerCase();
  const normalizedEntry = entry.toLowerCase();
  if (normalizedHostname === normalizedEntry) {
    return true;
  }
  return normalizedHostname.endsWith(`.${normalizedEntry}`);
};

export const findMatchingBlockListEntry = (
  hostname: string,
  entries: readonly string[]
): string | undefined => entries.find((entry) => hostnameMatchesBlockListEntry(hostname, entry));
