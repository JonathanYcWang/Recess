import {
  createMessagingSettingsClient,
  createSafariCompatibleRuntimeTransport,
  type SettingsClient,
} from '@/runtime';

let cachedClient: SettingsClient | null = null;

export const createAppSettingsClient = (): SettingsClient | null => {
  if (cachedClient) {
    return cachedClient;
  }
  const transport = createSafariCompatibleRuntimeTransport();
  if (!transport) {
    return null;
  }
  cachedClient = createMessagingSettingsClient(transport);
  return cachedClient;
};

export const resetAppSettingsClientForTests = (): void => {
  cachedClient = null;
};
