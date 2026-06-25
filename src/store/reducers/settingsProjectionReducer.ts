import { createReducer } from '@reduxjs/toolkit';
import {
  setSettingsConnectionState,
  setSettingsProjection,
} from '../actions/settingsProjectionActions';

export type SettingsConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface SettingsProjectionState {
  revision: number | null;
  connectionState: SettingsConnectionState;
}

const initialState: SettingsProjectionState = {
  revision: null,
  connectionState: 'connecting',
};

const settingsProjectionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setSettingsProjection, (state, action) => {
      state.revision = action.payload.revision;
      state.connectionState = 'connected';
    })
    .addCase(setSettingsConnectionState, (state, action) => {
      state.connectionState = action.payload;
    });
});

export default settingsProjectionReducer;
