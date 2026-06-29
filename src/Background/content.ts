import type { AppStateMessage } from '../Shared/Types/AppState';

chrome.runtime.onMessage.addListener((message: AppStateMessage) => {
  if (message.type === 'APP_STATE_CHANGED') {
    return;
  }
});
