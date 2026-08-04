import type { BackgroundEvent, PersistedAppState } from '../../Shared/Types/AppState';
import { getAllTabs, sendMessageToTab, broadcastToRuntime } from '../Adapters/TabAdapter';

const broadcastToContentScripts = async (message: BackgroundEvent): Promise<void> => {
  const tabs = await getAllTabs();

  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id) {
        await sendMessageToTab(tab.id, message);
      }
    })
  );
};

export const broadcastAppState = async (state: PersistedAppState): Promise<void> => {
  const message = { type: 'APP_STATE_CHANGED', state } satisfies BackgroundEvent;

  await broadcastToRuntime(message);
  await broadcastToContentScripts(message);
};
