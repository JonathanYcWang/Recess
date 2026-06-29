import {
  APP_STATE_STORAGE_KEY,
  applyAppAction,
  createDefaultPersistedAppState,
  isPersistedAppState,
  type AppAction,
  type AppActionResponse,
  type PersistedAppState,
} from '../../Shared/Types/AppState';
import { broadcastAppState } from '../Broadcasters/appStateBroadcaster';

const getStoredAppState = async (): Promise<PersistedAppState> => {
  const result = await chrome.storage.local.get(APP_STATE_STORAGE_KEY);
  const value = result[APP_STATE_STORAGE_KEY];

  return isPersistedAppState(value) ? value : createDefaultPersistedAppState();
};

const saveAppState = async (state: PersistedAppState): Promise<void> => {
  await chrome.storage.local.set({ [APP_STATE_STORAGE_KEY]: state });
};

export const handleAppAction = async (action: AppAction): Promise<AppActionResponse> => {
  const currentState = await getStoredAppState();
  const nextState = applyAppAction(currentState, action, new Date());

  await saveAppState(nextState);
  await broadcastAppState(nextState);

  return { ok: true };
};

export const handleGetAppState = async (): Promise<PersistedAppState> => {
  const state = await getStoredAppState();

  await saveAppState(state);

  return state;
};
