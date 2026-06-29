import {
  APP_STATE_STORAGE_KEY,
  applyAppCommand,
  createDefaultPersistedAppState,
  isPersistedAppState,
  type AppCommand,
  type AppCommandResponse,
  type AppStateMessage,
  type PersistedAppState,
} from '../appState';

const getStoredAppState = async (): Promise<PersistedAppState> => {
  const result = await chrome.storage.local.get(APP_STATE_STORAGE_KEY);
  const value = result[APP_STATE_STORAGE_KEY];

  return isPersistedAppState(value) ? value : createDefaultPersistedAppState();
};

const saveAppState = async (state: PersistedAppState): Promise<void> => {
  await chrome.storage.local.set({ [APP_STATE_STORAGE_KEY]: state });
};

const broadcastToContentScripts = async (
  message: AppStateMessage,
): Promise<void> => {
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, message).catch(() => undefined);
      }
    }),
  );
};

const broadcastAppState = async (state: PersistedAppState): Promise<void> => {
  const message = { type: 'APP_STATE_CHANGED', state } satisfies AppStateMessage;

  await chrome.runtime.sendMessage(message).catch(() => undefined);
  await broadcastToContentScripts(message);
};

export const handleAppCommand = async (
  command: AppCommand,
): Promise<AppCommandResponse> => {
  const currentState = await getStoredAppState();
  const nextState = applyAppCommand(currentState, command, new Date());

  await saveAppState(nextState);
  await broadcastAppState(nextState);

  return { ok: true };
};

export const handleGetAppState = async (): Promise<PersistedAppState> => {
  const state = await getStoredAppState();

  await saveAppState(state);

  return state;
};
