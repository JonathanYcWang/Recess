//
// background.ts — Service worker entrypoint (Manifest V3)
//
// This is the first file the browser loads when the extension starts.
// It wires incoming chrome.runtime messages to the internal action handlers.
//
// Responsibilities:
//   - Listen for messages from the UI (popup/page scripts
//   - Route APP_ACTION messages to the action handler for processing
//   - Route GET_APP_STATE requests to the state reader
//   - Send responses back to the caller
//
// This file contains no business logic — it is pure plumbing between
// the browser's messaging system and the architecture layers.

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
