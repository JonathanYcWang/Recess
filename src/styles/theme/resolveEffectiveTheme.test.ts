import { describe, expect, it } from 'vitest';
import { resolveEffectiveTheme } from './resolveEffectiveTheme';

describe('resolveEffectiveTheme', () => {
  it('returns light when preference is light', () => {
    expect(resolveEffectiveTheme('light', true)).toBe('light');
    expect(resolveEffectiveTheme('light', false)).toBe('light');
  });

  it('returns dark when preference is dark', () => {
    expect(resolveEffectiveTheme('dark', false)).toBe('dark');
    expect(resolveEffectiveTheme('dark', true)).toBe('dark');
  });

  it('follows prefers-color-scheme when preference is system', () => {
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
    expect(resolveEffectiveTheme('system', false)).toBe('light');
  });
});
