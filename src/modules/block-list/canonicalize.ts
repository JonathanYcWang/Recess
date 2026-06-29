import type { Result } from '@/runtime/persistence';

export type CanonicalizeError =
  | { kind: 'empty-input' }
  | { kind: 'invalid-hostname' }
  | { kind: 'unsupported-scheme' };

const DOMAIN_PATTERN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const isValidHostname = (hostname: string): boolean => DOMAIN_PATTERN.test(hostname);

const stripTrailingDot = (hostname: string): string =>
  hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;

export const canonicalizeBlockListInput = (input: string): Result<string, CanonicalizeError> => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: { kind: 'empty-input' } };
  }

  let hostname: string;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: { kind: 'unsupported-scheme' } };
    }
    if (url.username || url.password) {
      return { ok: false, error: { kind: 'invalid-hostname' } };
    }
    hostname = url.hostname;
  } catch {
    return { ok: false, error: { kind: 'invalid-hostname' } };
  }

  hostname = stripTrailingDot(hostname.toLowerCase());
  if (!hostname || !isValidHostname(hostname)) {
    return { ok: false, error: { kind: 'invalid-hostname' } };
  }

  return { ok: true, value: hostname };
};
