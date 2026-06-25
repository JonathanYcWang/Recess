import type { RootState } from '../index';
import type { SettingsConnectionState } from '../reducers/settingsProjectionReducer';

export const selectSettingsRevision = (state: RootState): number | null =>
  state.settingsProjection.revision;

export const selectSettingsConnectionState = (state: RootState): SettingsConnectionState =>
  state.settingsProjection.connectionState;
