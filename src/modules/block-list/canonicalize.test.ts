import { describe, expect, it } from 'vitest';
import { canonicalizeBlockListInput } from './canonicalize';
import { hostnameMatchesBlockListEntry } from './match';

describe('canonicalizeBlockListInput', () => {
  it('accepts bare hostnames', () => {
    expect(canonicalizeBlockListInput('Example.COM')).toEqual({
      ok: true,
      value: 'example.com',
    });
  });

  it('strips protocol, path, port, query, and fragment', () => {
    expect(canonicalizeBlockListInput('HTTPS://Example.com:443/path?q=1#frag')).toEqual({
      ok: true,
      value: 'example.com',
    });
  });

  it('removes trailing dots', () => {
    expect(canonicalizeBlockListInput('example.com.')).toEqual({
      ok: true,
      value: 'example.com',
    });
  });

  it('rejects empty input', () => {
    expect(canonicalizeBlockListInput('   ')).toEqual({
      ok: false,
      error: { kind: 'empty-input' },
    });
  });

  it('rejects unsupported schemes', () => {
    expect(canonicalizeBlockListInput('ftp://example.com')).toEqual({
      ok: false,
      error: { kind: 'unsupported-scheme' },
    });
  });

  it('rejects invalid hostnames', () => {
    expect(canonicalizeBlockListInput('not a domain')).toEqual({
      ok: false,
      error: { kind: 'invalid-hostname' },
    });
  });
});

describe('hostnameMatchesBlockListEntry', () => {
  it('matches exact hostnames and subdomains', () => {
    expect(hostnameMatchesBlockListEntry('example.com', 'example.com')).toBe(true);
    expect(hostnameMatchesBlockListEntry('www.example.com', 'example.com')).toBe(true);
  });

  it('rejects lookalike hostnames', () => {
    expect(hostnameMatchesBlockListEntry('notexample.com', 'example.com')).toBe(false);
    expect(hostnameMatchesBlockListEntry('example.com.evil.net', 'example.com')).toBe(false);
  });
});
