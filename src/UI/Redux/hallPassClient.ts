import { createHallPassSafariCompatibleRuntimeTransport } from '@/runtime/messaging/hallPassExtensionRuntimeTransport';
import { createMessagingHallPassClient } from '@/runtime/client/messagingHallPassClient';
import type { HallPassClient } from '@/runtime/hallPassTypes';
import { createConnectionAwareHallPassClient } from './hallPassConnectionAwareClient';

let cachedClient: HallPassClient | null = null;

export const createAppHallPassClient = (): HallPassClient | null => {
  if (cachedClient) {
    return cachedClient;
  }
  const transport = createHallPassSafariCompatibleRuntimeTransport();
  if (!transport) {
    return null;
  }
  cachedClient = createConnectionAwareHallPassClient(createMessagingHallPassClient(transport));
  return cachedClient;
};

export const resetAppHallPassClientForTests = (): void => {
  cachedClient = null;
};
