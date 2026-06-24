import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { TaskListClient, TaskListCommandHandler } from '../taskListTypes';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createInProcessTaskListClient = (handler: TaskListCommandHandler): TaskListClient => ({
  current: async () => handler.current(),
  command: async (envelope) => handler.execute(envelope),
  createTask: async (input, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'task-list',
      expectedRevision: options?.expectedRevision,
      command: {
        kind: 'create-task',
        title: input.title,
        originalEstimateMinutes: input.originalEstimateMinutes,
      },
    }),
  updateTitle: async (taskId, title, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'task-list',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'update-title', taskId, title },
    }),
  reorderTasks: async (orderedTaskIds, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'task-list',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'reorder-tasks', orderedTaskIds },
    }),
  completeTask: async (taskId, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'task-list',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'complete-task', taskId },
    }),
  deleteTask: async (taskId, options) =>
    handler.execute({
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: options?.commandId ?? createCommandId(),
      module: 'task-list',
      expectedRevision: options?.expectedRevision,
      command: { kind: 'delete-task', taskId },
    }),
  subscribe: (listener) => handler.subscribe(listener),
});
