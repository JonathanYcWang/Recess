// Background service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Recess extension installed');
});

// Note: onClick handler is not needed when default_popup is set in manifest.json
// The popup will open automatically when the extension icon is clicked

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'SESSION_START') {
    // Block sites during focus session
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
          condition: {
            urlFilter: '*',
            excludedInitiatorDomains: ['chrome-extension://'],
          },
        },
      ],
      removeRuleIds: [],
    });
  } else if (message.type === 'SESSION_END') {
    // Remove blocking rules
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
    });
  }
  return true;
});

// Alarm listener for session timers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'session-end') {
    chrome.storage.local.set({ sessionState: 'ended' });
  } else if (alarm.name === 'break-end') {
    chrome.storage.local.set({ breakState: 'ended' });
  }
});
