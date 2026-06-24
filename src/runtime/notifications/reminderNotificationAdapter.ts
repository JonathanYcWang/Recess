import type { Result } from '@/modules/persisted-application-state';

export type ReminderNotificationCapability = 'available' | 'unsupported' | 'permission-denied';

export type ReminderNotificationError =
  | { kind: 'capability-unavailable' }
  | { kind: 'permission-denied' }
  | { kind: 'delivery-failed' };

export interface ReminderNotificationPayload {
  occurrenceId: string;
  scheduleId: string;
}

export interface ReminderNotificationAdapter {
  readonly capability: ReminderNotificationCapability;
  deliver(payload: ReminderNotificationPayload): Promise<Result<void, ReminderNotificationError>>;
}

const toFailure = (error: ReminderNotificationError): Result<void, ReminderNotificationError> => ({
  ok: false,
  error,
});

export const createInMemoryReminderNotificationAdapter = (options?: {
  capability?: ReminderNotificationCapability;
  deliver?: boolean;
}): ReminderNotificationAdapter & { delivered: ReminderNotificationPayload[] } => {
  const delivered: ReminderNotificationPayload[] = [];
  const capability = options?.capability ?? 'available';
  const shouldDeliver = options?.deliver ?? true;

  return {
    capability,
    delivered,
    async deliver(payload) {
      if (capability === 'unsupported') {
        return toFailure({ kind: 'capability-unavailable' });
      }
      if (capability === 'permission-denied') {
        return toFailure({ kind: 'permission-denied' });
      }
      if (!shouldDeliver) {
        return toFailure({ kind: 'delivery-failed' });
      }
      delivered.push(payload);
      return { ok: true, value: undefined };
    },
  };
};

export const createChromiumReminderNotificationAdapter = (): ReminderNotificationAdapter => {
  const capability: ReminderNotificationCapability =
    typeof chrome !== 'undefined' &&
    typeof chrome.notifications?.create === 'function' &&
    typeof chrome.runtime?.getURL === 'function'
      ? 'available'
      : 'unsupported';

  return {
    capability,
    async deliver(payload) {
      if (capability !== 'available') {
        return toFailure({ kind: 'capability-unavailable' });
      }
      await new Promise<void>((resolve) => {
        chrome.notifications.create(
          payload.occurrenceId,
          {
            type: 'basic',
            iconUrl: 'assets/logo.png',
            title: 'Recess: Time to Start Work?',
            message: 'Would you like to start your work session now?',
            buttons: [{ title: 'Start Work' }],
            requireInteraction: true,
          },
          () => {
            void chrome.runtime.lastError;
            resolve();
          }
        );
      });
      return { ok: true, value: undefined };
    },
  };
};

export const createSafariCompatibleReminderNotificationAdapter = (): ReminderNotificationAdapter =>
  createChromiumReminderNotificationAdapter();
