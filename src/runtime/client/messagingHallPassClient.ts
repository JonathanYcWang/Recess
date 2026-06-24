import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type {
  HallPassClient,
  HallPassCommandHandler,
  HallPassPublishedSnapshot,
} from '../hallPassTypes';
import {
  HALL_PASS_RUNTIME_CHANNEL,
  type HallPassRuntimeMessagePort,
  type HallPassRuntimeMessageResponse,
  type HallPassRuntimeMessageTransport,
  type HallPassRuntimePortMessage,
  type HallPassRuntimeRequest,
} from '../messaging/hallPassMessages';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const unwrapCurrent = (response: HallPassRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'current') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

const unwrapCommand = (response: HallPassRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'command') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

export const createMessagingHallPassClient = (
  transport: HallPassRuntimeMessageTransport
): HallPassClient => ({
  current: async () =>
    unwrapCurrent(await transport.send({ channel: HALL_PASS_RUNTIME_CHANNEL, action: 'current' })),
  command: async (envelope) =>
    unwrapCommand(
      await transport.send({
        channel: HALL_PASS_RUNTIME_CHANNEL,
        action: 'command',
        envelope,
      })
    ),
  confirmGrant: async (requestId, options) =>
    unwrapCommand(
      await transport.send({
        channel: HALL_PASS_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
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
        },
      })
    ),
  cancelPending: async (requestId, options) =>
    unwrapCommand(
      await transport.send({
        channel: HALL_PASS_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'hall-pass',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'cancel-pending', requestId },
        },
      })
    ),
  subscribe(listener, options) {
    const port = transport.connect();
    const removeMessageListener = port.onMessage((message: HallPassRuntimePortMessage) => {
      if (message.action === 'snapshot') {
        listener(message.snapshot);
      }
    });
    const removeDisconnectListener = options?.onTransportLoss
      ? port.onDisconnect(() => options.onTransportLoss?.())
      : () => undefined;
    port.postMessage({ channel: HALL_PASS_RUNTIME_CHANNEL, action: 'subscribe' });
    return () => {
      removeMessageListener();
      removeDisconnectListener();
      port.disconnect();
    };
  },
});

export const createInProcessHallPassRuntimeTransport = (
  handler: HallPassCommandHandler
): HallPassRuntimeMessageTransport => {
  const ports = new Set<HallPassRuntimeMessagePort>();

  handler.subscribe((snapshot: HallPassPublishedSnapshot) => {
    for (const port of ports) {
      port.postMessage({
        channel: HALL_PASS_RUNTIME_CHANNEL,
        action: 'snapshot',
        snapshot,
      });
    }
  });

  return {
    async send(request: HallPassRuntimeRequest): Promise<HallPassRuntimeMessageResponse> {
      if (request.action === 'current') {
        return {
          channel: HALL_PASS_RUNTIME_CHANNEL,
          ok: true,
          action: 'current',
          result: handler.current(),
        };
      }
      const result = await handler.execute(request.envelope);
      return {
        channel: HALL_PASS_RUNTIME_CHANNEL,
        ok: true,
        action: 'command',
        result,
      };
    },
    connect() {
      const messageListeners = new Set<(message: HallPassRuntimePortMessage) => void>();
      const disconnectListeners = new Set<() => void>();
      const port: HallPassRuntimeMessagePort = {
        postMessage(message) {
          if (message.action === 'subscribe') {
            const current = handler.current();
            if (current.ok) {
              for (const listener of messageListeners) {
                listener({
                  channel: HALL_PASS_RUNTIME_CHANNEL,
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
