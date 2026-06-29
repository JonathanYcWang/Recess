import { handleAppCommand, handleGetAppState } from './Runtime/appStateCommandHandler';
import type { AppStateMessage } from '../Shared/Types/AppState';

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
