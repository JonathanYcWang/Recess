import type { SettingsClient, SettingsClientCommandResult } from '@/runtime';
import {
  getSettingsConnectionManager,
  isSettingsTransportError,
} from './settingsConnectionManager';

const transportUnavailable = (): SettingsClientCommandResult => ({
  ok: false,
  error: { kind: 'transport-unavailable' },
});

export const createConnectionAwareSettingsClient = (client: SettingsClient): SettingsClient => ({
  current: () => client.current(),
  subscribe: (listener, options) => client.subscribe(listener, options),
  command: async (envelope) => {
    const manager = getSettingsConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.command(envelope);
    if (!result.ok && isSettingsTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
});
