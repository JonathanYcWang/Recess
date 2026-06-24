import type { SettingsClient } from '@/runtime';
import type { AppDispatch } from './index';
import {
  resetSettingsConnectionManagerForTests,
  startSettingsConnectionManager,
} from './settingsConnectionManager';

let activeClient: SettingsClient | null = null;

export const startSettingsProjectionSubscription = (options: {
  client: SettingsClient;
  dispatch: AppDispatch;
}): (() => void) => {
  if (activeClient) {
    return () => undefined;
  }

  activeClient = options.client;
  startSettingsConnectionManager({
    client: options.client,
    dispatch: options.dispatch,
  });

  return () => {
    resetSettingsConnectionManagerForTests();
    activeClient = null;
  };
};

export const resetSettingsProjectionSubscriptionForTests = (): void => {
  resetSettingsConnectionManagerForTests();
  activeClient = null;
};
