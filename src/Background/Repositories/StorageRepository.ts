/**
 * StorageRepository — the only writer/reader to browser storage.
 * All storage access routes through this repository.
 */

import { parsePersistedAppState } from '@/Shared/Schema/PersistedAppStateSchema';
import type { PersistedAppState } from '@/Shared/Types/AppState';

const APP_STATE_STORAGE_KEY = 'appState';

const readAppState = async (): Promise<PersistedAppState> => {
  const result = await chrome.storage.local.get(APP_STATE_STORAGE_KEY);
  return parsePersistedAppState(result[APP_STATE_STORAGE_KEY]);
};

const writeAppState = async (state: PersistedAppState): Promise<void> => {
  await chrome.storage.local.set({ [APP_STATE_STORAGE_KEY]: state });
};

export const storageRepository = { readAppState, writeAppState };
