import { seedInitialStateInStorage } from './store/storageMiddleware';
import './backgroundSettingsRuntime';
import './backgroundBlockListRuntime';

// --- Work Hours Reminder Scheduling ---
const WORK_REMINDER_ALARM_PREFIX = 'work-reminder-';

// Helper: parse time string (e.g. '09:00 AM') to {hour, minute}
const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
  const [time, period] = timeStr.split(' ');
  const [hourPart, minute] = time.split(':').map(Number);
  let hour = hourPart;
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
const initialStateSeed = seedInitialStateInStorage();
initialStateSeed.then(scheduleWorkReminders);

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

type SessionNotificationMessage = {
  type: 'SESSION_NOTIFICATION';
  title: string;
  message: string;
};

type PingMessage = {
  type: 'PING';
};

type BackgroundMessage = SessionNotificationMessage | PingMessage;

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, _sender: chrome.runtime.MessageSender, sendResponse) => {
    if (!message || typeof message !== 'object' || !('type' in message)) {
      return;
    }

    if (message.type === 'PING') {
      sendResponse({ type: 'PONG' });
      return;
    }

    if (message.type === 'SESSION_NOTIFICATION') {
      const notificationId = `session-notification-${Date.now()}`;
      chrome.notifications.create(
        notificationId,
        {
          type: 'basic',
          iconUrl: 'assets/logo.png',
          title: message.title,
          message: message.message,
        },
        () => {
          const err = chrome.runtime.lastError;
          if (err) {
            console.warn('Failed to create notification:', err.message);
          }
        }
      );

      sendResponse({ ok: true });
      return;
    }
  }
);

// Handle extension icon clicks - always open in a new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

type PersistedBlockedSites = string[];
type PersistedTimerState = {
  sessionState?: string;
  selectedReward?: {
    name: string;
  } | null;
};
type ClosedBlockedTabs = string[];

const CLOSED_BLOCKED_TABS_STORAGE_KEY = 'closedBlockedTabs';

const FOCUS_BLOCKED_STATES = new Set([
  'ONGOING_FOCUS_SESSION',
  'FOCUS_SESSION_COUNTDOWN',
  'REWARD_SELECTION',
  'FOCUS_BLOCKED_STATES',
]);

let isSyncingBlockingState = false;
let shouldSyncBlockingStateAgain = false;
const syncBlockingState = async () => {
  if (isSyncingBlockingState) {
    shouldSyncBlockingStateAgain = true;
    return;
  }
  isSyncingBlockingState = true;

  try {
    do {
      shouldSyncBlockingStateAgain = false;
      try {
        const data = await chrome.storage.local.get(['blockedSites', 'timerState']);
        const sites = data.blockedSites as PersistedBlockedSites;
        const timerState = data.timerState as PersistedTimerState;
        const sessionState = timerState?.sessionState;

        if (sessionState && FOCUS_BLOCKED_STATES.has(sessionState)) {
          await closeBlockedTabs(sites, timerState);
          return;
        }

        await reopenClosedBlockedTabs();
      } catch (error) {
        console.error('Error syncing blocking state:', error);
      }
    } while (shouldSyncBlockingStateAgain);
  } finally {
    isSyncingBlockingState = false;
  }
};

const closeBlockedTabs = async (
  blockedSites: PersistedBlockedSites,
  timerState: PersistedTimerState | undefined
) => {
  const tabs = await chrome.tabs.query({});
  const tabsToClose = tabs.filter((tab) => {
    return Boolean(
      tab.id !== undefined && tab.url && shouldCloseTabUrl(tab.url, blockedSites, timerState)
    );
  });

  if (tabsToClose.length > 0) {
    await rememberClosedTabs(tabsToClose);
    await chrome.tabs.remove(tabsToClose.map((tab) => tab.id as number));
  }
};
const shouldCloseTabUrl = (
  url: string,
  blockedSites: PersistedBlockedSites,
  timerState: PersistedTimerState | undefined
): boolean => {
  const sessionState = timerState?.sessionState;
  const matchingBlockedSite = blockedSites.find((site) => urlMatchesSite(url, site));

  if (!matchingBlockedSite) {
    return false;
  } else if (sessionState === 'ONGOING_BREAK_SESSION') {
    const rewardSite = timerState?.selectedReward?.name;
    return !rewardSite || !urlMatchesSite(url, rewardSite);
  } else if (sessionState && FOCUS_BLOCKED_STATES.has(sessionState)) {
    return true;
  }

  return false;
};

const urlMatchesSite = (url: string, site: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const domain = site
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0];
    return hostname === domain || hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
};

const rememberClosedTabs = async (tabsToClose: chrome.tabs.Tab[]) => {
  const rememberedUrls = new Set(await getClosedBlockedTabs());

  for (const tab of tabsToClose) {
    if (tab.url) {
      rememberedUrls.add(tab.url);
    }
  }

  if (rememberedUrls.size > 0) {
    await setClosedBlockedTabs([...rememberedUrls]);
  }
};

const getClosedBlockedTabs = async (): Promise<ClosedBlockedTabs> => {
  const data = await chrome.storage.local.get([CLOSED_BLOCKED_TABS_STORAGE_KEY]);
  const closedTabs = data[CLOSED_BLOCKED_TABS_STORAGE_KEY];

  return Array.isArray(closedTabs) ? closedTabs : [];
};

const setClosedBlockedTabs = async (closedTabs: ClosedBlockedTabs) => {
  await chrome.storage.local.set({ [CLOSED_BLOCKED_TABS_STORAGE_KEY]: closedTabs });
};

const clearClosedBlockedTabs = async () => {
  await chrome.storage.local.remove([CLOSED_BLOCKED_TABS_STORAGE_KEY]);
};

const reopenClosedBlockedTabs = async () => {
  const closedTabs = await getClosedBlockedTabs();
  for (const url of closedTabs) {
    await chrome.tabs.create({
      url,
      active: false,
    });
  }
  await clearClosedBlockedTabs();
};

// Listen for storage changes
chrome.storage.onChanged.addListener(
  (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName !== 'local') return;

    if (changes.workHours) {
      scheduleWorkReminders();
    }

    if (changes.blockedSites || changes.timerState) {
      syncBlockingState();
    }
  }
);

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    syncBlockingState();
  }
});

// Initialize tab blocking on startup
initialStateSeed.then(syncBlockingState);
