import { describe, expect, it } from 'vitest';
import { normalizeBlockListEntry } from '@/Shared/Utils/normalizeBlockListEntry';

describe('normalizeBlockListEntry', () => {
  it('normalizes a full tab URL to a hostname', () => {
    expect(normalizeBlockListEntry('https://www.youtube.com/watch?v=1')).toBe('www.youtube.com');
  });

  it('normalizes bare hostnames for block-list input', () => {
    expect(normalizeBlockListEntry('YouTube.com')).toBe('youtube.com');
  });

  it('returns null for empty input', () => {
    expect(normalizeBlockListEntry('')).toBeNull();
    expect(normalizeBlockListEntry('   ')).toBeNull();
  });

  it('returns null for internal browser URLs', () => {
    expect(normalizeBlockListEntry('chrome://newtab/')).toBeNull();
    expect(normalizeBlockListEntry('about:blank')).toBeNull();
  });

  it('returns null for unparseable input', () => {
    expect(normalizeBlockListEntry('not a url')).toBeNull();
  });
});
