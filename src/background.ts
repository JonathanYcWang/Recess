import { handleAppCommand, handleGetAppState } from './runtime/background/appStateCommandHandler';
import type { AppStateMessage } from './runtime/appState';

chrome.runtime.onMessage.addListener((message: AppStateMessage, _sender, sendResponse) => {
  if (message.type === 'GET_APP_STATE') {
    handleGetAppState().then(sendResponse);
    return true;
  }

  if (message.type === 'APP_COMMAND') {
    handleAppCommand(message.command).then(sendResponse);
    return true;
  }

  return false;
});
