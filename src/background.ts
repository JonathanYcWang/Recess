import {
  addChromiumActionClickListener,
  addChromiumBackgroundMessageListener,
  createChromiumNotification,
  type BackgroundMessage,
} from '@/adapters/browser/chromium/chromiumBackgroundAdapter';
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

addChromiumBackgroundMessageListener((message: BackgroundMessage, sendResponse) => {
  if (!message || typeof message !== 'object' || !('type' in message)) {
    return;
  }

  if (message.type === 'PING') {
    sendResponse({ type: 'PONG' });
    return;
  }

  if (message.type === 'SESSION_NOTIFICATION') {
    const notificationId = `session-notification-${Date.now()}`;
    createChromiumNotification(notificationId, message.title, message.message);

    sendResponse({ ok: true });
    return;
  }
});

addChromiumActionClickListener();
