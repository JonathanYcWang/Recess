// --- Work Hours Reminder Scheduling ---
const WORK_REMINDER_ALARM_PREFIX = 'work-reminder-';

// Helper: parse time string (e.g. '09:00 AM') to {hour, minute}
const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
  const [time, period] = timeStr.split(' ');
  let [hour, minute] = time.split(':').map(Number);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
};

// Schedule alarms for all enabled work hour entries
const scheduleWorkReminders = async () => {
  const { workHours } = await chrome.storage.local.get(['workHours']);
  // Clear all previous alarms
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name.startsWith(WORK_REMINDER_ALARM_PREFIX)) {
      chrome.alarms.clear(alarm.name);
    }
  }
  if (!workHours || !Array.isArray(workHours)) return;
  const now = new Date();
  for (const entry of workHours) {
    if (!entry.enabled) continue;
    const { hour, minute } = parseTimeString(entry.time);
    for (let day = 0; day < 7; day++) {
      if (!entry.days[day]) continue;
      const next = new Date(now);
      next.setHours(hour, minute, 0, 0);
      const dayDiff = (day - now.getDay() + 7) % 7;
      const isPast =
        dayDiff === 0 &&
        (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute));
      next.setDate(now.getDate() + dayDiff + (isPast ? 7 : 0));
      chrome.alarms.create(`${WORK_REMINDER_ALARM_PREFIX}${entry.id}-${day}`, {
        when: next.getTime(),
      });
    }
  }
};

// Schedule on startup
scheduleWorkReminders();

// Handle alarm firing
chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name.startsWith(WORK_REMINDER_ALARM_PREFIX)) {
    chrome.notifications.create(alarm.name, {
      type: 'basic',
      iconUrl: 'assets/logo.png',
      title: 'Recess: Time to Start Work?',
      message: 'Would you like to start your work session now?',
      buttons: [{ title: 'Start Work' }],
      requireInteraction: true,
    });
  }
});

// Handle notification button click
chrome.notifications.onButtonClicked.addListener((notifId: string, btnIdx: number) => {
  if (notifId.startsWith(WORK_REMINDER_ALARM_PREFIX) && btnIdx === 0) {
    chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 420,
      height: 720,
    });
    chrome.notifications.clear(notifId);
  }
});

// Background service worker for Chrome extension

// Handle extension icon clicks - always open in a new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

type PersistedBlockedSites =
  | string[]
  | {
      sites?: string[];
      closeDistractingSites?: boolean;
    }
  | undefined;

const getBlockedSitesAndToggle = (persisted: PersistedBlockedSites) => {
  if (Array.isArray(persisted)) {
    return { sites: persisted, closeDistractingSites: false };
  }

  return {
    sites: persisted?.sites ?? [],
    closeDistractingSites: Boolean(persisted?.closeDistractingSites),
  };
};

// Helper function to check if a URL matches any blocked site
const isDistractingSite = (url: string, blockedSites: string[]): boolean => {
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
};

// Close all tabs that match the blocked sites list
const closeDistractingTabs = async () => {
  try {
    const data = await chrome.storage.local.get(['blockedSites']);
    const { sites, closeDistractingSites } = getBlockedSitesAndToggle(data.blockedSites);

    if (!closeDistractingSites) {
      return;
    }

    if (sites.length === 0) {
      return;
    }

    // Query all tabs
    const tabs = await chrome.tabs.query({});

    // Find tabs that match blocked sites
    const tabsToClose = tabs.filter(
      (tab: chrome.tabs.Tab) => tab.url && tab.id !== undefined && isDistractingSite(tab.url, sites)
    );

    // Close matching tabs
    for (const tab of tabsToClose) {
      if (tab.id !== undefined) {
        await chrome.tabs.remove(tab.id);
      }
    }
  } catch (error) {
    console.error('Error closing distracting tabs:', error);
  }
};

// Listen for new tabs being created or updated
chrome.tabs.onCreated.addListener(async (tab: chrome.tabs.Tab) => {
  if (tab.pendingUrl || tab.url) {
    const url = tab.pendingUrl || tab.url;
    if (url && tab.id !== undefined) {
      await checkAndCloseTab(tab.id, url);
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
  if (changeInfo.url) {
    await checkAndCloseTab(tabId, changeInfo.url);
  }
});

// Check if a tab should be closed and close it
const checkAndCloseTab = async (tabId: number, url: string) => {
  try {
    const data = await chrome.storage.local.get(['blockedSites']);
    const { sites, closeDistractingSites } = getBlockedSitesAndToggle(data.blockedSites);

    if (!closeDistractingSites) {
      return;
    }

    if (isDistractingSite(url, sites)) {
      await chrome.tabs.remove(tabId);
    }
  } catch (error) {
    console.error('Error checking/closing tab:', error);
  }
};

// Update declarativeNetRequest rules based on current session state
const updateBlockingRules = async () => {
  try {
    const data = await chrome.storage.local.get(['blockedSites', 'timerState']);
    const { sites } = getBlockedSitesAndToggle(data.blockedSites);
    const timerState = data.timerState;

    // Only block sites during active focus sessions
    const shouldBlock = timerState?.sessionState === 'ONGOING_FOCUS_SESSION';

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((rule: chrome.declarativeNetRequest.Rule) => rule.id);

    if (shouldBlock && sites.length > 0) {
      // Create blocking rules for each site
      const rules = sites.map((site, index) => ({
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

      // Update rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: rules as chrome.declarativeNetRequest.Rule[],
      });
    } else {
      // Remove all blocking rules
      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
        });
      }
    }
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
};

// Listen for storage changes
chrome.storage.onChanged.addListener(
  (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName !== 'local') return;

    if (changes.workHours) {
      scheduleWorkReminders();
    }

    if (changes.blockedSites || changes.timerState) {
      updateBlockingRules();

      // If the close-distracting-sites toggle was turned ON, close existing tabs.
      const nextBlockedSites = changes.blockedSites?.newValue as PersistedBlockedSites;
      if (nextBlockedSites) {
        const { closeDistractingSites } = getBlockedSitesAndToggle(nextBlockedSites);
        if (closeDistractingSites) {
          closeDistractingTabs();
        }
      }
    }
  }
);

// Initialize rules on startup
updateBlockingRules();
