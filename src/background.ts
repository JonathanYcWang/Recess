import { seedInitialStateInStorage } from './store/storageMiddleware';
import './backgroundSettingsRuntime';
import './backgroundBlockListEnforcement';
import './backgroundWorkstyleProfileRuntime';
import './backgroundWorkRhythmRuntime';

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

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }
  if (changes.workHours) {
    scheduleWorkReminders();
  }
});
