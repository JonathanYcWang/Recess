import type { AppStateMessage, PersistedAppState } from '../../Shared/Types/AppState';

const broadcastToContentScripts = async (message: AppStateMessage): Promise<void> => {
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, message).catch(() => undefined);
      }
    })
  );
};

export const broadcastAppState = async (state: PersistedAppState): Promise<void> => {
  const message = { type: 'APP_STATE_CHANGED', state } satisfies AppStateMessage;

  await chrome.runtime.sendMessage(message).catch(() => undefined);
  await broadcastToContentScripts(message);
};
