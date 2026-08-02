/** Normalizes user input or a tab URL to a block-list hostname, or null if not enforceable. */
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
