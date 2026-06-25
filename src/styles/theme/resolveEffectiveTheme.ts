import type { ThemePreference } from '@/modules/persisted-application-state';

export type EffectiveTheme = 'light' | 'dark';

export const resolveEffectiveTheme = (
  preference: ThemePreference,
  prefersDark: boolean
): EffectiveTheme => {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return preference;
};
