import { createAction } from '@reduxjs/toolkit';
import type { PersistedAppState } from '@/runtime/appState';

export const setAppState = createAction<PersistedAppState>('appState/set');
