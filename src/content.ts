// Content script for Chrome extension
//
// Note: Site blocking is now handled by declarativeNetRequest in background.ts
// This content script is kept for potential future features like in-page notifications

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ type: 'PONG' });
  }
});
