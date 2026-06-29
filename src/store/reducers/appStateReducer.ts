import { createReducer } from '@reduxjs/toolkit';
import {
  createDefaultPersistedAppState,
  type PersistedAppState,
} from '@/runtime/appState';
import { setAppState } from '../actions/appStateActions';

export const appStateReducer = createReducer<PersistedAppState>(
  createDefaultPersistedAppState(),
  (builder) => {
    builder.addCase(setAppState, (_state, action) => action.payload);
  },
);
