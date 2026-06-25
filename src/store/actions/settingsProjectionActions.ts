import { createAction } from '@reduxjs/toolkit';
import type { SettingsConnectionState } from '../reducers/settingsProjectionReducer';

export const setSettingsProjection = createAction<{
  revision: number;
}>('settingsProjection/setProjection');

export const setSettingsConnectionState = createAction<SettingsConnectionState>(
  'settingsProjection/setConnectionState'
);
