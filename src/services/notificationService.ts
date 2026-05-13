/**
 * Send a notification via Chrome runtime messaging
 */
const send = (title: string, message: string): void => {
  if (!chrome?.runtime?.sendMessage) return;

  // Ping first to avoid noisy "Receiving end does not exist" errors in cases
  // where the background listener isn't registered (e.g., during development).
  chrome.runtime.sendMessage({ type: 'PING' }, (_pong) => {
    const pingErr = chrome.runtime.lastError;
    if (pingErr) {
      // No receiver; nothing to do.
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'SESSION_NOTIFICATION',
        title,
        message,
      },
      () => {
        const err = chrome.runtime.lastError;
        if (err) {
          // Swallow to prevent uncaught promise errors; log for debugging.
          console.debug('Notification message not delivered:', err.message);
        }
      }
    );
  });
};

/**
 * Send focus session ending notification
 */
export const notifyFocusEnding = (minutesLeft: number): void => {
  send('Focus Ending Soon', `${minutesLeft} minutes left in your focus session!`);
};

/**
 * Send focus session complete notification
 */
export const notifyFocusComplete = (): void => {
  send('Focus Complete', 'Your focus session has ended!');
};

/**
 * Send break ending notification
 */
export const notifyBreakEnding = (minutesLeft: number): void => {
  send('Break Ending Soon', `${minutesLeft} minutes left in your break!`);
};

/**
 * Send break complete notification
 */
export const notifyBreakComplete = (): void => {
  send('Break Complete', 'Your break has ended!');
};
