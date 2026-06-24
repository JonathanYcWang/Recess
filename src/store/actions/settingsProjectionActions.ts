import { createAction } from '@reduxjs/toolkit';
import type { ThemePreference } from '@/modules/persisted-application-state';
import type { SettingsConnectionState } from '../reducers/settingsProjectionReducer';

export const setSettingsProjection = createAction<{
  revision: number;
  themePreference: ThemePreference;
}>('settingsProjection/setProjection');

export const setSettingsConnectionState = createAction<SettingsConnectionState>(
  'settingsProjection/setConnectionState'
);
