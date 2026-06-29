export type WorkStartReminderValue = {
  startsAt: string | null;
};

export type WorkStartReminderNotificationRequest = {
  id: string;
  scheduledAt: string;
  title: string;
  message: string;
};

export const createDefaultWorkStartReminderValue = (): WorkStartReminderValue => ({
  startsAt: null,
});

export const setWorkStartReminder = (startsAt: Date): WorkStartReminderValue => ({
  startsAt: startsAt.toISOString(),
});

export const clearWorkStartReminder = (): WorkStartReminderValue => ({
  startsAt: null,
});

export const createWorkStartReminderNotificationRequest = (
  value: WorkStartReminderValue
): WorkStartReminderNotificationRequest | null =>
  value.startsAt
    ? {
        id: 'work-start-reminder',
        scheduledAt: value.startsAt,
        title: 'Time to start',
        message: 'Your focus block is ready.',
      }
    : null;
