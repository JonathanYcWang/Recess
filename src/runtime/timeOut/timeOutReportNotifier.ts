export interface TimeOutReportPayload {
  sessionId: string;
  boundaryIndex: number;
  elapsedMinutes: number;
}

export interface TimeOutReportNotifier {
  notify(payload: TimeOutReportPayload): Promise<void>;
}

export const createNoOpTimeOutReportNotifier = (): TimeOutReportNotifier => ({
  async notify() {
    return;
  },
});

export const createSessionNotificationTimeOutReportNotifier = (): TimeOutReportNotifier => ({
  async notify(payload) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      return;
    }
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'SESSION_NOTIFICATION',
          title: 'Time Out update',
          message: `${payload.elapsedMinutes} minutes in your Time Out.`,
        },
        () => {
          void chrome.runtime.lastError;
          resolve();
        }
      );
    });
  },
});
