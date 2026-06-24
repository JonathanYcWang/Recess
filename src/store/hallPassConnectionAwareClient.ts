import type { HallPassClient, HallPassClientCommandResult } from '@/runtime/hallPassTypes';
import {
  getHallPassConnectionManager,
  isHallPassTransportError,
} from './hallPassConnectionManager';

const transportUnavailable = (): HallPassClientCommandResult => ({
  ok: false,
  error: { kind: 'transport-unavailable' },
});

export const createConnectionAwareHallPassClient = (client: HallPassClient): HallPassClient => ({
  current: () => client.current(),
  subscribe: (listener, options) => client.subscribe(listener, options),
  command: async (envelope) => {
    const manager = getHallPassConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.command(envelope);
    if (!result.ok && isHallPassTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  confirmGrant: async (requestId, options) => {
    const manager = getHallPassConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.confirmGrant(requestId, options);
    if (!result.ok && isHallPassTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  cancelPending: async (requestId, options) => {
    const manager = getHallPassConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.cancelPending(requestId, options);
    if (!result.ok && isHallPassTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  revoke: async (passId, options) => {
    const manager = getHallPassConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.revoke(passId, options);
    if (!result.ok && isHallPassTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
});
