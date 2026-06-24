import type { WorkStartReminderClient } from '@/runtime/workStartReminderTypes';
import type { AppDispatch } from './index';
import {
  resetWorkStartReminderConnectionManagerForTests,
  startWorkStartReminderConnectionManager,
} from './workStartReminderConnectionManager';

let activeClient: WorkStartReminderClient | null = null;

export const startWorkStartReminderProjectionSubscription = (options: {
  client: WorkStartReminderClient;
  dispatch: AppDispatch;
}): (() => void) => {
  if (activeClient) {
    return () => undefined;
  }

  activeClient = options.client;
  startWorkStartReminderConnectionManager({
    client: options.client,
    dispatch: options.dispatch,
  });

  return () => {
    resetWorkStartReminderConnectionManagerForTests();
    activeClient = null;
  };
};

export const resetWorkStartReminderProjectionSubscriptionForTests = (): void => {
  resetWorkStartReminderConnectionManagerForTests();
  activeClient = null;
};
