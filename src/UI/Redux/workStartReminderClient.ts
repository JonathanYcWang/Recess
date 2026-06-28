import { createWorkStartReminderSafariCompatibleRuntimeTransport } from '@/runtime/messaging/workStartReminderExtensionRuntimeTransport';
import { createMessagingWorkStartReminderClient } from '@/runtime/client/messagingWorkStartReminderClient';
import type { WorkStartReminderClient } from '@/runtime/workStartReminderTypes';
import { createConnectionAwareWorkStartReminderClient } from './workStartReminderConnectionAwareClient';

let cachedClient: WorkStartReminderClient | null = null;

export const createAppWorkStartReminderClient = (): WorkStartReminderClient | null => {
  if (cachedClient) {
    return cachedClient;
  }
  const transport = createWorkStartReminderSafariCompatibleRuntimeTransport();
  if (!transport) {
    return null;
  }
  cachedClient = createConnectionAwareWorkStartReminderClient(
    createMessagingWorkStartReminderClient(transport)
  );
  return cachedClient;
};

export const resetAppWorkStartReminderClientForTests = (): void => {
  cachedClient = null;
};
