import type { ThemePreference } from '@/modules/persisted-application-state';
import type { SettingsClient, SettingsCommandHandler } from '../types';

export const createInProcessSettingsClient = (handler: SettingsCommandHandler): SettingsClient => ({
  current: async () => handler.current(),
  setThemePreference: async (preference: ThemePreference) =>
    handler.dispatch({
      kind: 'set-theme-preference',
      preference,
    }),
});
