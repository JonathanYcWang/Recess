import type { SettingsClient, SettingsCommandHandler } from '../types';

export const createInProcessSettingsClient = (handler: SettingsCommandHandler): SettingsClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  subscribe: (listener) => handler.subscribe(listener),
});
