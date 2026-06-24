import type { TaskListClient } from '@/runtime/taskListTypes';
import type { AppDispatch } from './index';
import {
  resetTaskListConnectionManagerForTests,
  startTaskListConnectionManager,
} from './taskListConnectionManager';

let activeClient: TaskListClient | null = null;

export const startTaskListProjectionSubscription = (options: {
  client: TaskListClient;
  dispatch: AppDispatch;
}): (() => void) => {
  if (activeClient) {
    return () => undefined;
  }

  activeClient = options.client;
  startTaskListConnectionManager({
    client: options.client,
    dispatch: options.dispatch,
  });

  return () => {
    resetTaskListConnectionManagerForTests();
    activeClient = null;
  };
};

export const resetTaskListProjectionSubscriptionForTests = (): void => {
  resetTaskListConnectionManagerForTests();
  activeClient = null;
};
