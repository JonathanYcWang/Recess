import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { SettingsClient, SettingsCommandHandler, SettingsSnapshot } from '../types';
import {
  SETTINGS_RUNTIME_CHANNEL,
  type SettingsRuntimeMessageResponse,
  type SettingsRuntimePortMessage,
  type SettingsRuntimeRequest,
} from '../messaging/messages';
import type { RuntimeMessagePort, RuntimeMessageTransport } from '../messaging/runtimeTransport';

const createCommandId = (): string =>
  `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const unwrapCurrent = (response: SettingsRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'current') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

const unwrapCommand = (response: SettingsRuntimeMessageResponse) => {
  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }
  if (response.action !== 'command') {
    return { ok: false as const, error: { kind: 'malformed-payload' as const } };
  }
  return response.result;
};

export const createMessagingSettingsClient = (
  transport: RuntimeMessageTransport
): SettingsClient => ({
  current: async () =>
    unwrapCurrent(await transport.send({ channel: SETTINGS_RUNTIME_CHANNEL, action: 'current' })),
  command: async (envelope) =>
    unwrapCommand(
      await transport.send({
        channel: SETTINGS_RUNTIME_CHANNEL,
        action: 'command',
        envelope,
      })
    ),
  setThemePreference: async (preference, options) =>
    unwrapCommand(
      await transport.send({
        channel: SETTINGS_RUNTIME_CHANNEL,
        action: 'command',
        envelope: {
          protocolVersion: RUNTIME_PROTOCOL_VERSION,
          commandId: options?.commandId ?? createCommandId(),
          module: 'settings',
          expectedRevision: options?.expectedRevision,
          command: { kind: 'set-theme-preference', preference },
        },
      })
    ),
  subscribe(listener, options) {
    const port = transport.connect();
    const removeMessageListener = port.onMessage((message: SettingsRuntimePortMessage) => {
      if (message.action === 'snapshot') {
        listener(message.snapshot);
      }
    });
    const removeDisconnectListener = options?.onTransportLoss
      ? port.onDisconnect(() => options.onTransportLoss?.())
      : () => undefined;
    port.postMessage({ channel: SETTINGS_RUNTIME_CHANNEL, action: 'subscribe' });
    return () => {
      removeMessageListener();
      removeDisconnectListener();
      port.disconnect();
    };
  },
});

export const createInProcessRuntimeTransport = (
  handler: SettingsCommandHandler
): RuntimeMessageTransport => {
  const ports = new Set<RuntimeMessagePort>();

  handler.subscribe((snapshot: SettingsSnapshot) => {
    for (const port of ports) {
      port.postMessage({
        channel: SETTINGS_RUNTIME_CHANNEL,
        action: 'snapshot',
        snapshot,
      });
    }
  });

  return {
    async send(request: SettingsRuntimeRequest): Promise<SettingsRuntimeMessageResponse> {
      if (request.action === 'current') {
        return {
          channel: SETTINGS_RUNTIME_CHANNEL,
          ok: true,
          action: 'current',
          result: handler.current(),
        };
      }
      const result = await handler.execute(request.envelope);
      return {
        channel: SETTINGS_RUNTIME_CHANNEL,
        ok: true,
        action: 'command',
        result,
      };
    },
    connect() {
      const messageListeners = new Set<(message: SettingsRuntimePortMessage) => void>();
      const disconnectListeners = new Set<() => void>();
      const port: RuntimeMessagePort = {
        postMessage(message) {
          if (message.action === 'subscribe') {
            const current = handler.current();
            if (current.ok) {
              for (const listener of messageListeners) {
                listener({
                  channel: SETTINGS_RUNTIME_CHANNEL,
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
