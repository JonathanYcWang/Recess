// Content script for Chrome extension

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'CHECK_BLOCKED') {
    // Check if site should be blocked
    const currentUrl = window.location.href;
    chrome.storage.local.get(['blockedSites', 'sessionState'], (result) => {
      const blockedSites = result.blockedSites || [];
      const isBlocked = blockedSites.some((site: string) => currentUrl.includes(site));
      
      if (isBlocked && result.sessionState === 'active') {
        // Redirect to break page or show block message
        window.location.href = chrome.runtime.getURL('index.html#/break');
      }
    });
  }
});

