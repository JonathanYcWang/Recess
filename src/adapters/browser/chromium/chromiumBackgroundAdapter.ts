type SessionNotificationMessage = {
  type: 'SESSION_NOTIFICATION';
  title: string;
  message: string;
};

type PingMessage = {
  type: 'PING';
};

export type BackgroundMessage = SessionNotificationMessage | PingMessage;

type BackgroundResponse = { type: 'PONG' } | { ok: true };

export const addChromiumBackgroundMessageListener = (
  listener: (
    message: BackgroundMessage,
    sendResponse: (response: BackgroundResponse) => void
  ) => void
): void => {
  chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    listener(message, sendResponse);
  });
};

export const createChromiumNotification = (
  notificationId: string,
  title: string,
  message: string
): void => {
  chrome.notifications.create(
    notificationId,
    {
      type: 'basic',
      iconUrl: 'assets/logo.png',
      title,
      message,
    },
    () => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error('Failed to create notification', err);
      }
    }
  );
};

export const addChromiumActionClickListener = (): void => {
  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  });
};
