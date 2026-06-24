import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type {
  WorkStartReminderClient,
  WorkStartReminderCommandHandler,
  WorkStartReminderPublishedSnapshot,
} from '../workStartReminderTypes';
import {
  WORK_START_REMINDER_RUNTIME_CHANNEL,
  type WorkStartReminderRuntimeMessagePort,
  type WorkStartReminderRuntimeMessageResponse,
  type WorkStartReminderRuntimeMessageTransport,
  type WorkStartReminderRuntimePortMessage,
  type WorkStartReminderRuntimeRequest,
} from '../messaging/workStartReminderMessages';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const unwrapCurrent = (response: WorkStartReminderRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'current') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

const unwrapCommand = (response: WorkStartReminderRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'command') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

export const createMessagingWorkStartReminderClient = (
  transport: WorkStartReminderRuntimeMessageTransport
): WorkStartReminderClient => ({
  current: async () =>
    unwrapCurrent(
      await transport.send({ channel: WORK_START_REMINDER_RUNTIME_CHANNEL, action: 'current' })
    ),
  command: async (envelope) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
        action: 'command',
        envelope,
      })
    ),
  addSchedule: async (input, options) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'work-start-reminder',
          expectedRevision: options?.expectedRevision,
          command: {
            kind: 'add-schedule',
            time: input.time,
            days: input.days,
            enabled: input.enabled,
          },
        },
      })
    ),
  updateSchedule: async (id, input, options) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'work-start-reminder',
          expectedRevision: options?.expectedRevision,
          command: {
            kind: 'update-schedule',
            id,
            time: input.time,
            days: input.days,
            enabled: input.enabled,
          },
        },
      })
    ),
  deleteSchedule: async (id, options) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'work-start-reminder',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'delete-schedule', id },
        },
      })
    ),
  toggleScheduleEnabled: async (id, options) =>
    unwrapCommand(
      await transport.send({
        channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'work-start-reminder',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'toggle-schedule-enabled', id },
        },
      })
    ),
  subscribe(listener, options) {
    const port = transport.connect();
    const removeMessageListener = port.onMessage((message: WorkStartReminderRuntimePortMessage) => {
      if (message.action === 'snapshot') {
        listener(message.snapshot);
      }
    });
    const removeDisconnectListener = options?.onTransportLoss
      ? port.onDisconnect(() => options.onTransportLoss?.())
      : () => undefined;
    port.postMessage({ channel: WORK_START_REMINDER_RUNTIME_CHANNEL, action: 'subscribe' });
    return () => {
      removeMessageListener();
      removeDisconnectListener();
      port.disconnect();
    };
  },
});

export const createInProcessWorkStartReminderRuntimeTransport = (
  handler: WorkStartReminderCommandHandler
): WorkStartReminderRuntimeMessageTransport => {
  const ports = new Set<WorkStartReminderRuntimeMessagePort>();

  handler.subscribe((snapshot: WorkStartReminderPublishedSnapshot) => {
    for (const port of ports) {
      port.postMessage({
        channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
        action: 'snapshot',
        snapshot,
      });
    }
  });

  return {
    async send(
      request: WorkStartReminderRuntimeRequest
    ): Promise<WorkStartReminderRuntimeMessageResponse> {
      if (request.action === 'current') {
        return {
          channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
          ok: true,
          action: 'current',
          result: handler.current(),
        };
      }
      const result = await handler.execute(request.envelope);
      return {
        channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
        ok: true,
        action: 'command',
        result,
      };
    },
    connect() {
      const messageListeners = new Set<(message: WorkStartReminderRuntimePortMessage) => void>();
      const disconnectListeners = new Set<() => void>();
      const port: WorkStartReminderRuntimeMessagePort = {
        postMessage(message) {
          if (message.action === 'subscribe') {
            const current = handler.current();
            if (current.ok) {
              for (const listener of messageListeners) {
                listener({
                  channel: WORK_START_REMINDER_RUNTIME_CHANNEL,
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
