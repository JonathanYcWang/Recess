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

      // Handle closeDistractingSites toggle changes
      if (changes.blockedSites?.newValue?.closeDistractingSites !== undefined) {
        const newToggleState = changes.blockedSites.newValue.closeDistractingSites;
        if (newToggleState) {
          // Toggle was turned ON - close all existing distracting tabs
          closeDistractingTabs();
        }
      }
    }
  }
});

// Helper function to check if a URL matches any blocked site
function isDistractingSite(url: string, blockedSites: string[]): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return blockedSites.some((site) => {
      const normalizedSite = site.toLowerCase();
      return hostname === normalizedSite || hostname.endsWith('.' + normalizedSite);
    });
  } catch {
    return false;
  }
}

// Close all tabs that match the blocked sites list
async function closeDistractingTabs() {
  try {
    const data = await chrome.storage.local.get(['blockedSites']);
    const blockedSitesState = data.blockedSites;

    if (!blockedSitesState?.closeDistractingSites) {
      return;
    }

    const sites: string[] = blockedSitesState.sites || [];
    if (sites.length === 0) {
      return;
    }

    // Query all tabs
    const tabs = await chrome.tabs.query({});

    // Find tabs that match blocked sites
    const tabsToClose = tabs.filter(
      (tab) => tab.url && tab.id !== undefined && isDistractingSite(tab.url, sites)
    );

    // Close matching tabs
    for (const tab of tabsToClose) {
      if (tab.id !== undefined) {
        await chrome.tabs.remove(tab.id);
      }
    }

    if (tabsToClose.length > 0) {
      console.log(`Closed ${tabsToClose.length} distracting tabs`);
    }
  } catch (error) {
    console.error('Error closing distracting tabs:', error);
  }
}

// Listen for new tabs being created or updated
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.pendingUrl || tab.url) {
    const url = tab.pendingUrl || tab.url;
    if (url) {
      await checkAndCloseTab(tab.id!, url);
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url) {
    await checkAndCloseTab(tabId, changeInfo.url);
  }
});

// Check if a tab should be closed and close it
async function checkAndCloseTab(tabId: number, url: string) {
  try {
    const data = await chrome.storage.local.get(['blockedSites']);
    const blockedSitesState = data.blockedSites;

    if (!blockedSitesState?.closeDistractingSites) {
      return;
    }

    const sites: string[] = blockedSitesState.sites || [];

    if (isDistractingSite(url, sites)) {
      await chrome.tabs.remove(tabId);
      console.log(`Closed distracting tab: ${url}`);
    }
  } catch (error) {
    console.error('Error checking/closing tab:', error);
  }
}

// Update declarativeNetRequest rules based on current session state
async function updateBlockingRules() {
  try {
    const data = await chrome.storage.local.get(['blockedSites', 'timerState']);
    const blockedSites: string[] = data.blockedSites || [];
    const timerState = data.timerState;

    // Only block sites during active focus sessions
    const shouldBlock = timerState?.sessionState === 'ONGOING_FOCUS_SESSION';

    if (shouldBlock && blockedSites.length > 0) {
      // Create blocking rules for each site
      const rules = blockedSites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            url: chrome.runtime.getURL('index.html'),
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
