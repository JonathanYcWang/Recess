import { createMessagingWorkRhythmClient } from '@/runtime/client/messagingWorkRhythmClient';
import { createWorkRhythmSafariCompatibleRuntimeTransport } from '@/runtime/messaging/workRhythmExtensionRuntimeTransport';
import type { WorkRhythmClient } from '@/runtime/workRhythmTypes';
import { createConnectionAwareWorkRhythmClient } from './workRhythmConnectionAwareClient';

let cachedClient: WorkRhythmClient | null = null;

export const createAppWorkRhythmClient = (): WorkRhythmClient | null => {
  if (cachedClient) {
    return cachedClient;
  }
  const transport = createWorkRhythmSafariCompatibleRuntimeTransport();
  if (!transport) {
    return null;
  }
  cachedClient = createConnectionAwareWorkRhythmClient(createMessagingWorkRhythmClient(transport));
  return cachedClient;
};

export const resetAppWorkRhythmClientForTests = (): void => {
  cachedClient = null;
};
