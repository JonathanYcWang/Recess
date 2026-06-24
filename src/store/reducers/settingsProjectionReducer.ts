import { createReducer } from '@reduxjs/toolkit';
import type { ThemePreference } from '@/modules/persisted-application-state';
import {
  setSettingsConnectionState,
  setSettingsProjection,
} from '../actions/settingsProjectionActions';

export type SettingsConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface SettingsProjectionState {
  revision: number | null;
  themePreference: ThemePreference | null;
  connectionState: SettingsConnectionState;
}

const initialState: SettingsProjectionState = {
  revision: null,
  themePreference: null,
  connectionState: 'connecting',
};

const settingsProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setSettingsProjection, (state, action) => {
      state.revision = action.payload.revision;
      state.themePreference = action.payload.themePreference;
      state.connectionState = 'connected';
    })
    .addCase(setSettingsConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default settingsProjectionReducer;
