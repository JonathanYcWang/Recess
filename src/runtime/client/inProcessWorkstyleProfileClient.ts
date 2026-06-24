import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type {
  WorkstyleProfileClient,
  WorkstyleProfileCommandHandler,
} from '../workstyleProfileTypes';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createInProcessWorkstyleProfileClient = (
  handler: WorkstyleProfileCommandHandler
): WorkstyleProfileClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  subscribe: (listener) => handler.subscribe(listener),
});

export const createWorkstyleProfileCommandEnvelope = (
  command: Parameters<WorkstyleProfileClient['command']>[0]['command'],
  options?: { commandId?: string; expectedRevision?: number }
) => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  commandId: options?.commandId ?? createCommandId(),
  module: 'workstyle-profile' as const,
  expectedRevision: options?.expectedRevision,
  command,
});
