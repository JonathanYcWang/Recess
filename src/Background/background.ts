import { handleAppAction, handleGetAppState } from './ActionHandlers/appStateActionHandler';
import type { AppStateMessage } from '../Shared/Types/AppState';

chrome.runtime.onMessage.addListener((message: AppStateMessage, _sender, sendResponse) => {
  if (message.type === 'GET_APP_STATE') {
    handleGetAppState().then(sendResponse);
    return true;
  }

  if (message.type === 'APP_ACTION') {
    handleAppAction(message.action).then(sendResponse);
    return true;
  }

  return false;
});
