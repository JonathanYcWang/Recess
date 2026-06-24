import {
  createMessagingSettingsClient,
  createSafariCompatibleRuntimeTransport,
  type SettingsClient,
} from '@/runtime';
import { createConnectionAwareSettingsClient } from './settingsConnectionAwareClient';

let cachedClient: SettingsClient | null = null;

export const createAppSettingsClient = (): SettingsClient | null => {
  if (cachedClient) {
    return cachedClient;
  }
  const transport = createSafariCompatibleRuntimeTransport();
  if (!transport) {
    return null;
  }
  cachedClient = createConnectionAwareSettingsClient(createMessagingSettingsClient(transport));
  return cachedClient;
};

export const resetAppSettingsClientForTests = (): void => {
  cachedClient = null;
};
