import { configureStore } from '@reduxjs/toolkit';
import { appStateReducer } from './Slices/AppState/reducer';

export const store = configureStore({
  reducer: {
    appState: appStateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
