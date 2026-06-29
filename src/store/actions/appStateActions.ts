import { createAction } from '@reduxjs/toolkit';
import type { PersistedAppState } from '@/Shared/Types/AppState';

export const setAppState = createAction<PersistedAppState>('appState/set');
