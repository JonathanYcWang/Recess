// Background service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Recess extension installed');
});

// Handle extension icon clicks - always open in a new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Listen for storage changes to update site blocking rules
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    // If blocked sites or session state changed, update blocking rules
    if (changes.blockedSites || changes.timerState) {
      updateBlockingRules();
    }
  }
});

// Update declarativeNetRequest rules based on current session state
async function updateBlockingRules() {
  try {
    const data = await chrome.storage.local.get(['blockedSites', 'timerState']);
    const blockedSites: string[] = data.blockedSites || [];
    const timerState = data.timerState;

    // Only block sites during active focus sessions
    const shouldBlock = timerState?.sessionState === 'DURING_SESSION';

    if (shouldBlock && blockedSites.length > 0) {
      // Create blocking rules for each site
      const rules = blockedSites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            url: chrome.runtime.getURL('index.html#/main'),
          },
        },
        condition: {
          urlFilter: `*://*.${site}/*`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      }));

      // Get existing rule IDs to remove
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map((rule) => rule.id);

      // Update rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: rules as chrome.declarativeNetRequest.Rule[],
      });

      console.log(`Blocking ${blockedSites.length} sites during focus session`);
    } else {
      // Remove all blocking rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map((rule) => rule.id);

      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
        });
        console.log('Removed all site blocking rules');
      }
    }
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
}

// Initialize rules on startup
updateBlockingRules();
