import { createReducer } from '@reduxjs/toolkit';
import { createDefaultPersistedAppState, type PersistedAppState } from '@/Shared/Types/AppState';
import { setAppState } from './actions';

export const appStateReducer = createReducer<PersistedAppState>(
  createDefaultPersistedAppState(),
  (builder) => {
    builder.addCase(setAppState, (_state, action) => action.payload);
  }
);
