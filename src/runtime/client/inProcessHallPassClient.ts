import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { HallPassClient, HallPassCommandHandler } from '../hallPassTypes';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createInProcessHallPassClient = (handler: HallPassCommandHandler): HallPassClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  confirmGrant: async (requestId, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'hall-pass',
      expectedRevision: options?.expectedRevision,
      command: {
        kind: 'confirm-grant',
        requestId,
        passId: options?.passId ?? createCommandId(),
        grantedAtEpochMs: Date.now(),
      },
    }),
  cancelPending: async (requestId, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'hall-pass',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'cancel-pending', requestId },
    }),
  subscribe: (listener) => handler.subscribe(listener),
});
