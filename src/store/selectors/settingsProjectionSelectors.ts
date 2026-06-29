import type { ThemePreference } from '@/runtime/persistence';
import type { RootState } from '../index';
import type { SettingsConnectionState } from '../reducers/settingsProjectionReducer';

export const selectSettingsRevision = (state: RootState): number | null =>
  state.settingsProjection.revision;

export const selectThemePreference = (state: RootState): ThemePreference | null =>
  state.settingsProjection.themePreference;

export const selectSettingsConnectionState = (state: RootState): SettingsConnectionState =>
  state.settingsProjection.connectionState;

export const selectRenderableThemePreference = (state: RootState): ThemePreference =>
  state.settingsProjection.themePreference ?? 'system';
