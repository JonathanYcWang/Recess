import { createMessagingBlockListClient } from '@/runtime/client/messagingBlockListClient';
import { createBlockListSafariCompatibleRuntimeTransport } from '@/runtime/messaging/blockListExtensionRuntimeTransport';
import type { BlockListClient } from '@/runtime/blockListTypes';
import { createConnectionAwareBlockListClient } from './blockListConnectionAwareClient';

let cachedClient: BlockListClient | null = null;

export const createAppBlockListClient = (): BlockListClient | null => {
  if (cachedClient) {
    return cachedClient;
  }
  const transport = createBlockListSafariCompatibleRuntimeTransport();
  if (!transport) {
    return null;
  }
  cachedClient = createConnectionAwareBlockListClient(createMessagingBlockListClient(transport));
  return cachedClient;
};

export const resetAppBlockListClientForTests = (): void => {
  cachedClient = null;
};
