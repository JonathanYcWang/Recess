import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { WorkRhythmClient, WorkRhythmCommandHandler } from '../workRhythmTypes';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createInProcessWorkRhythmClient = (
  handler: WorkRhythmCommandHandler
): WorkRhythmClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  selectTasks: async (taskIds, options) =>
    handler.execute(createWorkRhythmCommandEnvelope({ kind: 'select-tasks', taskIds }, options)),
  setActiveTask: async (taskId, options) =>
    handler.execute(createWorkRhythmCommandEnvelope({ kind: 'set-active-task', taskId }, options)),
  subscribe: (listener) => handler.subscribe(listener),
});

export const createWorkRhythmCommandEnvelope = (
  command: Parameters<WorkRhythmClient['command']>[0]['command'],
  options?: { commandId?: string; expectedRevision?: number }
) => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  commandId: options?.commandId ?? createCommandId(),
  module: 'work-rhythm' as const,
  expectedRevision: options?.expectedRevision,
  command,
});
