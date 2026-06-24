import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type {
  WorkRhythmClient,
  WorkRhythmCommandHandler,
  WorkRhythmPublishedSnapshot,
} from '../workRhythmTypes';
import {
  WORK_RHYTHM_RUNTIME_CHANNEL,
  type WorkRhythmRuntimeMessagePort,
  type WorkRhythmRuntimeMessageResponse,
  type WorkRhythmRuntimeMessageTransport,
  type WorkRhythmRuntimePortMessage,
  type WorkRhythmRuntimeRequest,
} from '../messaging/workRhythmMessages';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const unwrapCurrent = (response: WorkRhythmRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'current') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

const unwrapCommand = (response: WorkRhythmRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'command') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

export const createMessagingWorkRhythmClient = (
  transport: WorkRhythmRuntimeMessageTransport
): WorkRhythmClient => ({
  current: async () =>
    unwrapCurrent(
      await transport.send({ channel: WORK_RHYTHM_RUNTIME_CHANNEL, action: 'current' })
    ),
  command: async (envelope) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        action: 'command',
        envelope,
      })
    ),
  selectTasks: async (taskIds, options) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'work-rhythm',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'select-tasks', taskIds },
        },
      })
    ),
  setActiveTask: async (taskId, options) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'work-rhythm',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'set-active-task', taskId },
        },
      })
    ),
  completeTask: async (taskId, options) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'work-rhythm',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'complete-task', taskId },
        },
      })
    ),
  subscribe(listener, options) {
    const port = transport.connect();
    const removeMessageListener = port.onMessage((message: WorkRhythmRuntimePortMessage) => {
      if (message.action === 'snapshot') {
        listener(message.snapshot);
      }
    });
    const removeDisconnectListener = options?.onTransportLoss
      ? port.onDisconnect(() => options.onTransportLoss?.())
      : () => undefined;
    port.postMessage({ channel: WORK_RHYTHM_RUNTIME_CHANNEL, action: 'subscribe' });
    return () => {
      removeMessageListener();
      removeDisconnectListener();
      port.disconnect();
    };
  },
});

export const createInProcessWorkRhythmRuntimeTransport = (
  handler: WorkRhythmCommandHandler
): WorkRhythmRuntimeMessageTransport => {
  const ports = new Set<WorkRhythmRuntimeMessagePort>();

  handler.subscribe((snapshot: WorkRhythmPublishedSnapshot) => {
    for (const port of ports) {
      port.postMessage({
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        action: 'snapshot',
        snapshot,
      });
    }
  });

  return {
    async send(request: WorkRhythmRuntimeRequest): Promise<WorkRhythmRuntimeMessageResponse> {
      if (request.action === 'current') {
        return {
          channel: WORK_RHYTHM_RUNTIME_CHANNEL,
          ok: true,
          action: 'current',
          result: handler.current(),
        };
      }
      const result = await handler.execute(request.envelope);
      return {
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        ok: true,
        action: 'command',
        result,
      };
    },
    connect() {
      const messageListeners = new Set<(message: WorkRhythmRuntimePortMessage) => void>();
      const disconnectListeners = new Set<() => void>();
      const port: WorkRhythmRuntimeMessagePort = {
        postMessage(message) {
          if (message.action === 'subscribe') {
            const current = handler.current();
            if (current.ok) {
              for (const listener of messageListeners) {
                listener({
                  channel: WORK_RHYTHM_RUNTIME_CHANNEL,
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
