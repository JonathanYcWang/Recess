export type Destination =
  | { kind: 'website'; url: string; hostname: string }
  | { kind: 'private-browsing' }
  | { kind: 'internal' }
  | { kind: 'unsupported'; reason: string };

export const parseDestination = (url: string): Destination => {
  const trimmed = url.trim();
  if (!trimmed) {
    return { kind: 'unsupported', reason: 'empty-url' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { kind: 'unsupported', reason: 'malformed-url' };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol === 'chrome-extension:' || protocol === 'safari-web-extension:') {
    return { kind: 'internal' };
  }
  if (protocol === 'about:' || protocol === 'chrome:' || protocol === 'edge:') {
    return { kind: 'internal' };
  }
  if (protocol !== 'http:' && protocol !== 'https:') {
    return { kind: 'unsupported', reason: `unsupported-protocol:${protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname) {
    return { kind: 'unsupported', reason: 'missing-hostname' };
  }

  return { kind: 'website', url: trimmed, hostname };
};
