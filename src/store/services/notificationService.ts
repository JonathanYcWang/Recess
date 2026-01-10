/**
 * Service for sending Chrome extension notifications
 * Encapsulates notification business logic
 */
export class NotificationService {
  /**
   * Send a notification via Chrome runtime messaging
   */
  static send(title: string, message: string): void {
    chrome?.runtime?.sendMessage({
      type: 'SESSION_NOTIFICATION',
      title,
      message,
    });
  }

  /**
   * Send focus session ending notification
   */
  static notifyFocusEnding(minutesLeft: number): void {
    this.send('Focus Ending Soon', `${minutesLeft} minutes left in your focus session!`);
  }

  /**
   * Send focus session complete notification
   */
  static notifyFocusComplete(): void {
    this.send('Focus Complete', 'Your focus session has ended!');
  }

  /**
   * Send break ending notification
   */
  static notifyBreakEnding(minutesLeft: number): void {
    this.send('Break Ending Soon', `${minutesLeft} minutes left in your break!`);
  }

  /**
   * Send break complete notification
   */
  static notifyBreakComplete(): void {
    this.send('Break Complete', 'Your break has ended!');
  }
}
