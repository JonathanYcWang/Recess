import type { AppStateMessage } from './runtime/appState';

chrome.runtime.onMessage.addListener((message: AppStateMessage) => {
  if (message.type === 'APP_STATE_CHANGED') {
    return;
  }
});
