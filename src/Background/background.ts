//
// background.ts — Service worker entrypoint (Manifest V3)
//
// This is the first file the browser loads when the extension starts.
// It wires incoming browser.runtime messages to the internal action handlers.
//
// Responsibilities:
//   - Listen for messages from the UI (popup/page scripts
//   - Route APP_ACTION messages to the action handler for processing
//   - Route GET_APP_STATE requests to the state reader
//   - Send responses back to the caller
//
// This file contains no business logic — it is pure plumbing between
// the browser's messaging system and the architecture layers.
import browser from 'webextension-polyfill';
import { registerBlockedTabEnforcementOnTabUpdates } from './Adapters/TabAdapter';
import { handleAppAction, handleGetAppState } from './ActionHandlers/appStateActionHandler';
import type { BackgroundRequest } from '../Shared/Types/AppState';

const isBackgroundRequest = (value: object): value is BackgroundRequest => {
  if (!('type' in value)) {
    return false;
  }

  if (value.type === 'GET_APP_STATE') {
    return true;
  }

  if (value.type === 'APP_ACTION') {
    if (!('action' in value)) {
      return false;
    }

    return value.action !== null;
  }

  return false;
};

registerBlockedTabEnforcementOnTabUpdates();

browser.runtime.onMessage.addListener(async (message: unknown) => {
  if (typeof message !== 'object' || message === null || !isBackgroundRequest(message)) {
    return;
  }

  if (message.type === 'GET_APP_STATE') {
    return handleGetAppState();
  }
  if (message.type === 'APP_ACTION') {
    return handleAppAction(message.action);
  }
});
