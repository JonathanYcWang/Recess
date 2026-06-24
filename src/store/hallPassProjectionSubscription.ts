import type { HallPassClient } from '@/runtime/hallPassTypes';
import type { AppDispatch } from './index';
import {
  resetHallPassConnectionManagerForTests,
  startHallPassConnectionManager,
} from './hallPassConnectionManager';

let activeClient: HallPassClient | null = null;

export const startHallPassProjectionSubscription = (options: {
  client: HallPassClient;
  dispatch: AppDispatch;
}): (() => void) => {
  if (activeClient) {
    return () => undefined;
  }

  activeClient = options.client;
  startHallPassConnectionManager({
    client: options.client,
    dispatch: options.dispatch,
  });

  return () => {
    resetHallPassConnectionManagerForTests();
    activeClient = null;
  };
};

export const resetHallPassProjectionSubscriptionForTests = (): void => {
  resetHallPassConnectionManagerForTests();
  activeClient = null;
};
