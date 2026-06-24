import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { BlockListClient, BlockListCommandHandler } from '../blockListTypes';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createInProcessBlockListClient = (
  handler: BlockListCommandHandler
): BlockListClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  addEntry: async (input, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'block-list',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'add-entry', input },
    }),
  removeEntry: async (hostname, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'block-list',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'remove-entry', hostname },
    }),
  subscribe: (listener) => handler.subscribe(listener),
});
