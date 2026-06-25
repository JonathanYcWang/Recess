import { seedInitialStateInStorage } from './store/storageMiddleware';
import './backgroundSettingsRuntime';
import './backgroundBlockListEnforcement';
import './backgroundWorkstyleProfileRuntime';
import './backgroundWorkRhythmRuntime';
import './backgroundHallPassRuntime';
import './backgroundWorkStartReminderRuntime';
import './backgroundTaskListRuntime';
import './backgroundInsightsRuntime';

void seedInitialStateInStorage();

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

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
