// Background service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Recess extension installed');
});

// Handle extension icon clicks - always open in a new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

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
