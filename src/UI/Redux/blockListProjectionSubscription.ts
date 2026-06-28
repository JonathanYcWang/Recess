import type { BlockListClient } from '@/runtime/blockListTypes';
import type { AppDispatch } from './index';
import {
  resetBlockListConnectionManagerForTests,
  startBlockListConnectionManager,
} from './blockListConnectionManager';

let activeClient: BlockListClient | null = null;

export const startBlockListProjectionSubscription = (options: {
  client: BlockListClient;
  dispatch: AppDispatch;
}): (() => void) => {
  if (activeClient) {
    return () => undefined;
  }

  activeClient = options.client;
  startBlockListConnectionManager({
    client: options.client,
    dispatch: options.dispatch,
  });

  return () => {
    resetBlockListConnectionManagerForTests();
    activeClient = null;
  };
};

export const resetBlockListProjectionSubscriptionForTests = (): void => {
  resetBlockListConnectionManagerForTests();
  activeClient = null;
};
