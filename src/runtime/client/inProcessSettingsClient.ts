import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { SettingsClient, SettingsCommandHandler } from '../types';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createInProcessSettingsClient = (handler: SettingsCommandHandler): SettingsClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  setThemePreference: async (preference, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'settings',
      expectedRevision: options?.expectedRevision,
      command: {
        kind: 'set-theme-preference',
        preference,
      },
    }),
  subscribe: (listener) => handler.subscribe(listener),
});
