import type { BlockListClient, BlockListClientCommandResult } from '@/runtime/blockListTypes';
import {
  getBlockListConnectionManager,
  isBlockListTransportError,
} from './blockListConnectionManager';

const transportUnavailable = (): BlockListClientCommandResult => ({
  ok: false,
  error: { kind: 'transport-unavailable' },
});

export const createConnectionAwareBlockListClient = (client: BlockListClient): BlockListClient => ({
  current: () => client.current(),
  subscribe: (listener, options) => client.subscribe(listener, options),
  command: async (envelope) => {
    const manager = getBlockListConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.command(envelope);
    if (!result.ok && isBlockListTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  addEntry: async (input, options) => {
    const manager = getBlockListConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.addEntry(input, options);
    if (!result.ok && isBlockListTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
  removeEntry: async (hostname, options) => {
    const manager = getBlockListConnectionManager();
    if (manager?.getConnectionState() === 'disconnected') {
      return transportUnavailable();
    }
    const result = await client.removeEntry(hostname, options);
    if (!result.ok && isBlockListTransportError(result.error)) {
      manager?.markDisconnected();
    }
    return result;
  },
});
