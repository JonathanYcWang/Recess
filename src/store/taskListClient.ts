import { createMessagingTaskListClient } from '@/runtime/client/messagingTaskListClient';
import { createTaskListSafariCompatibleRuntimeTransport } from '@/runtime/messaging/taskListExtensionRuntimeTransport';
import type { TaskListClient } from '@/runtime/taskListTypes';
import { createConnectionAwareTaskListClient } from './taskListConnectionAwareClient';

let cachedClient: TaskListClient | null = null;

export const createAppTaskListClient = (): TaskListClient | null => {
  if (cachedClient) {
    return cachedClient;
  }
  const transport = createTaskListSafariCompatibleRuntimeTransport();
  if (!transport) {
    return null;
  }
  cachedClient = createConnectionAwareTaskListClient(createMessagingTaskListClient(transport));
  return cachedClient;
};

export const resetAppTaskListClientForTests = (): void => {
  cachedClient = null;
};
