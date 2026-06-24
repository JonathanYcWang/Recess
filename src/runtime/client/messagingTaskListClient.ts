import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type {
  TaskListClient,
  TaskListCommandHandler,
  TaskListPublishedSnapshot,
} from '../taskListTypes';
import {
  TASK_LIST_RUNTIME_CHANNEL,
  type TaskListRuntimeMessagePort,
  type TaskListRuntimeMessageResponse,
  type TaskListRuntimeMessageTransport,
  type TaskListRuntimePortMessage,
  type TaskListRuntimeRequest,
} from '../messaging/taskListMessages';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const unwrapCurrent = (response: TaskListRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'current') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

const unwrapCommand = (response: TaskListRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'command') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

export const createMessagingTaskListClient = (
  transport: TaskListRuntimeMessageTransport
): TaskListClient => ({
  current: async () =>
    unwrapCurrent(await transport.send({ channel: TASK_LIST_RUNTIME_CHANNEL, action: 'current' })),
  command: async (envelope) =>
    unwrapCommand(
      await transport.send({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope,
      })
    ),
  createTask: async (input, options) =>
    unwrapCommand(
      await transport.send({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'task-list',
          expectedRevision: options?.expectedRevision,
          command: {
            kind: 'create-task',
            title: input.title,
            originalEstimateMinutes: input.originalEstimateMinutes,
          },
        },
      })
    ),
  updateTitle: async (taskId, title, options) =>
    unwrapCommand(
      await transport.send({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'task-list',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'update-title', taskId, title },
        },
      })
    ),
  reorderTasks: async (orderedTaskIds, options) =>
    unwrapCommand(
      await transport.send({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'task-list',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'reorder-tasks', orderedTaskIds },
        },
      })
    ),
  completeTask: async (taskId, options) =>
    unwrapCommand(
      await transport.send({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'task-list',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'complete-task', taskId },
        },
      })
    ),
  deleteTask: async (taskId, options) =>
    unwrapCommand(
      await transport.send({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'task-list',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'delete-task', taskId },
        },
      })
    ),
  subscribe(listener, options) {
    const port = transport.connect();
    const removeMessageListener = port.onMessage((message: TaskListRuntimePortMessage) => {
      if (message.action === 'snapshot') {
        listener(message.snapshot);
      }
    });
    const removeDisconnectListener = options?.onTransportLoss
      ? port.onDisconnect(() => options.onTransportLoss?.())
      : () => undefined;
    port.postMessage({ channel: TASK_LIST_RUNTIME_CHANNEL, action: 'subscribe' });
    return () => {
      removeMessageListener();
      removeDisconnectListener();
      port.disconnect();
    };
  },
});

export const createInProcessTaskListRuntimeTransport = (
  handler: TaskListCommandHandler
): TaskListRuntimeMessageTransport => {
  const ports = new Set<TaskListRuntimeMessagePort>();

  handler.subscribe((snapshot: TaskListPublishedSnapshot) => {
    for (const port of ports) {
      port.postMessage({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'snapshot',
        snapshot,
      });
    }
  });

  return {
    async send(request: TaskListRuntimeRequest): Promise<TaskListRuntimeMessageResponse> {
      if (request.action === 'current') {
        return {
          channel: TASK_LIST_RUNTIME_CHANNEL,
          ok: true,
          action: 'current',
          result: handler.current(),
        };
      }
      const result = await handler.execute(request.envelope);
      return {
        channel: TASK_LIST_RUNTIME_CHANNEL,
        ok: true,
        action: 'command',
        result,
      };
    },
    connect() {
      const messageListeners = new Set<(message: TaskListRuntimePortMessage) => void>();
      const disconnectListeners = new Set<() => void>();
      const port: TaskListRuntimeMessagePort = {
        postMessage(message) {
          if (message.action === 'subscribe') {
            const current = handler.current();
            if (current.ok) {
              for (const listener of messageListeners) {
                listener({
                  channel: TASK_LIST_RUNTIME_CHANNEL,
                  action: 'snapshot',
                  snapshot: current.value,
                });
              }
            }
            return;
          }
          for (const listener of messageListeners) {
            listener(message);
          }
        },
        disconnect() {
          ports.delete(port);
          for (const listener of disconnectListeners) {
            listener();
          }
        },
        onMessage(listener) {
          messageListeners.add(listener);
          return () => messageListeners.delete(listener);
        },
        onDisconnect(listener) {
          disconnectListeners.add(listener);
          return () => disconnectListeners.delete(listener);
        },
      };
      ports.add(port);
      return port;
    },
  };
};
