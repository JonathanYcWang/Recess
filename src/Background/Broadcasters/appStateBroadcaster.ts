import type { BackgroundEvent, PersistedAppState } from '../../Shared/Types/AppState';
import { getAllTabs, sendMessageToTab, broadcastToRuntime } from '../Adapters/TabAdapter';

const broadcastToContentScripts = async (message: BackgroundEvent): Promise<void> => {
  const tabsById = await getAllTabs();

  await Promise.all(
    [...tabsById.keys()].map(async (tabId) => {
      await sendMessageToTab(tabId, message);
    })
  );
};

export const broadcastAppState = async (state: PersistedAppState): Promise<void> => {
  const message = { type: 'APP_STATE_CHANGED', state } satisfies BackgroundEvent;

  await broadcastToRuntime(message);
  await broadcastToContentScripts(message);
};
