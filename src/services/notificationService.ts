/**
 * Send a notification via Chrome runtime messaging
 */
const send = (title: string, message: string): void => {
  chrome?.runtime?.sendMessage({
    type: 'SESSION_NOTIFICATION',
    title,
    message,
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
