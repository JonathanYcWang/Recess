//
// content.ts — Content script entrypoint
//
// Injected into every web page the extension runs on.
// Receives broadcast messages from the background worker (e.g. APP_STATE_CHANGED)
// and can enforce blocking or relay page state back.
//
// Currently a placeholder — listens for state changes but takes no action.
// Future: enforce block list, detect navigation, report page metadata.

import type { AppStateMessage } from '../Shared/Types/AppState';

chrome.runtime.onMessage.addListener((message: AppStateMessage) => {
  if (message.type === 'APP_STATE_CHANGED') {
    return;
  }
});
