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
import { storageRepository } from '../Repositories/StorageRepository';

const getStoredAppState = async (): Promise<PersistedAppState> => {
  const value = await storageRepository.read<PersistedAppState>(APP_STATE_STORAGE_KEY);
  return isPersistedAppState(value) ? value : createDefaultPersistedAppState();
};

const saveAppState = async (state: PersistedAppState): Promise<void> => {
  await storageRepository.write(APP_STATE_STORAGE_KEY, state);
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
