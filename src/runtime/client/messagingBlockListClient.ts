import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type {
  BlockListClient,
  BlockListCommandHandler,
  BlockListSnapshot,
} from '../blockListTypes';
import {
  BLOCK_LIST_RUNTIME_CHANNEL,
  type BlockListRuntimeMessagePort,
  type BlockListRuntimeMessageResponse,
  type BlockListRuntimeMessageTransport,
  type BlockListRuntimePortMessage,
  type BlockListRuntimeRequest,
} from '../messaging/blockListMessages';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const unwrapCurrent = (response: BlockListRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'current') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

const unwrapCommand = (response: BlockListRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'command') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

export const createMessagingBlockListClient = (
  transport: BlockListRuntimeMessageTransport
): BlockListClient => ({
  current: async () =>
    unwrapCurrent(await transport.send({ channel: BLOCK_LIST_RUNTIME_CHANNEL, action: 'current' })),
  command: async (envelope) =>
    unwrapCommand(
      await transport.send({
        channel: BLOCK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope,
      })
    ),
  addEntry: async (input, options) =>
    unwrapCommand(
      await transport.send({
        channel: BLOCK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'block-list',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'add-entry', input },
        },
      })
    ),
  removeEntry: async (hostname, options) =>
    unwrapCommand(
      await transport.send({
        channel: BLOCK_LIST_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'block-list',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'remove-entry', hostname },
        },
      })
    ),
  subscribe(listener, options) {
    const port = transport.connect();
    const removeMessageListener = port.onMessage((message: BlockListRuntimePortMessage) => {
      if (message.action === 'snapshot') {
        listener(message.snapshot);
      }
    });
    const removeDisconnectListener = options?.onTransportLoss
      ? port.onDisconnect(() => options.onTransportLoss?.())
      : () => undefined;
    port.postMessage({ channel: BLOCK_LIST_RUNTIME_CHANNEL, action: 'subscribe' });
    return () => {
      removeMessageListener();
      removeDisconnectListener();
      port.disconnect();
    };
  },
});

export const createInProcessBlockListRuntimeTransport = (
  handler: BlockListCommandHandler
): BlockListRuntimeMessageTransport => {
  const ports = new Set<BlockListRuntimeMessagePort>();

  handler.subscribe((snapshot: BlockListSnapshot) => {
    for (const port of ports) {
      port.postMessage({
        channel: BLOCK_LIST_RUNTIME_CHANNEL,
        action: 'snapshot',
        snapshot,
      });
    }
  });

  return {
    async send(request: BlockListRuntimeRequest): Promise<BlockListRuntimeMessageResponse> {
      if (request.action === 'current') {
        return {
          channel: BLOCK_LIST_RUNTIME_CHANNEL,
          ok: true,
          action: 'current',
          result: handler.current(),
        };
      }
      const result = await handler.execute(request.envelope);
      return {
        channel: BLOCK_LIST_RUNTIME_CHANNEL,
        ok: true,
        action: 'command',
        result,
      };
    },
    connect() {
      const messageListeners = new Set<(message: BlockListRuntimePortMessage) => void>();
      const disconnectListeners = new Set<() => void>();
      const port: BlockListRuntimeMessagePort = {
        postMessage(message) {
          if (message.action === 'subscribe') {
            const current = handler.current();
            if (current.ok) {
              for (const listener of messageListeners) {
                listener({
                  channel: BLOCK_LIST_RUNTIME_CHANNEL,
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
