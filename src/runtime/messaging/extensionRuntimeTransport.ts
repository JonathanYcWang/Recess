import {
  SETTINGS_RUNTIME_CHANNEL,
  SETTINGS_RUNTIME_PORT_NAME,
  type SettingsRuntimeMessageResponse,
  type SettingsRuntimePortMessage,
  type SettingsRuntimeRequest,
} from './messages';
import type { ExtensionRuntimeApi, ExtensionRuntimePort } from './extensionRuntimeApi';
import type { RuntimeMessagePort, RuntimeMessageTransport } from './runtimeTransport';

interface RuntimeChannelMessage {
  channel: string;
}

interface RuntimeTransportConfig {
  channel: string;
  portName: string;
}

type RuntimeTransportErrorKind =
  | 'missing-receiver'
  | 'closed-channel'
  | 'malformed-payload'
  | 'extension-shutdown'
  | 'transport-unavailable';

const settingsRuntimeTransportConfig: RuntimeTransportConfig = {
  channel: SETTINGS_RUNTIME_CHANNEL,
  portName: SETTINGS_RUNTIME_PORT_NAME,
};

const isRuntimeChannelMessage = (message: unknown): message is RuntimeChannelMessage =>
  typeof message === 'object' &&
  message !== null &&
  'channel' in message &&
  typeof (message as RuntimeChannelMessage).channel === 'string';

const classifyRuntimeError = (message: string | undefined): RuntimeTransportErrorKind => {
  if (message?.includes('message port closed')) {
    return 'closed-channel';
  }

  if (message?.includes('Extension context invalidated')) {
    return 'extension-shutdown';
  }

  return 'missing-receiver';
};

const toTransportError = <Response extends RuntimeChannelMessage>(
  kind: RuntimeTransportErrorKind,
  channel: string
): Response =>
  ({
    channel,
    ok: false,
    error: { kind },
  }) as unknown as Response;

const createRuntimePort = <PortMessage>(
  port: ExtensionRuntimePort
): RuntimeMessagePort<PortMessage> => ({
  postMessage(message) {
    port.postMessage(message);
  },
  disconnect() {
    port.disconnect();
  },
  onMessage(listener) {
    const messageListeners = new Set<(message: PortMessage) => void>();
    const onMessage = (message: unknown) => {
      messageListeners.forEach((registeredListener) => registeredListener(message as PortMessage));
    };

    if (messageListeners.size === 0) {
      port.onMessage.addListener(onMessage);
    }

    messageListeners.add(listener);

    return () => {
      messageListeners.delete(listener);
      if (messageListeners.size === 0) {
        port.onMessage.removeListener(onMessage);
      }
    };
  },
  onDisconnect(listener) {
    port.onDisconnect.addListener(listener);
    return () => port.onDisconnect.removeListener(listener);
  },
});

export const createExtensionRuntimeTransport = <
  Request extends RuntimeChannelMessage = SettingsRuntimeRequest,
  Response extends RuntimeChannelMessage = SettingsRuntimeMessageResponse,
  PortMessage = SettingsRuntimePortMessage,
>(
  runtime: ExtensionRuntimeApi,
  config: RuntimeTransportConfig = settingsRuntimeTransportConfig
): RuntimeMessageTransport<Request, Response, PortMessage> => ({
  async send(request: Request): Promise<Response> {
    try {
      const response = await runtime.sendMessage(request);
      if (!isRuntimeChannelMessage(response) || response.channel !== config.channel) {
        const message = (runtime as { lastError?: { message?: string } }).lastError?.message;
        const kind = response === undefined ? classifyRuntimeError(message) : 'malformed-payload';
        return toTransportError<Response>(kind, config.channel);
      }

      return response as Response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Runtime message failed';
      return toTransportError<Response>(classifyRuntimeError(message), config.channel);
    }
  },
  connect() {
    return createRuntimePort<PortMessage>(runtime.connect({ name: config.portName }));
  },
});

export const createChromiumRuntimeTransport = <
  Request extends RuntimeChannelMessage = SettingsRuntimeRequest,
  Response extends RuntimeChannelMessage = SettingsRuntimeMessageResponse,
  PortMessage = SettingsRuntimePortMessage,
>(
  config: RuntimeTransportConfig = settingsRuntimeTransportConfig
): RuntimeMessageTransport<Request, Response, PortMessage> | null => {
  const browserRuntime = globalThis.chrome?.runtime;
  if (!browserRuntime) {
    return null;
  }

  return createExtensionRuntimeTransport<Request, Response, PortMessage>(browserRuntime, config);
};

export const createSafariCompatibleRuntimeTransport = <
  Request extends RuntimeChannelMessage = SettingsRuntimeRequest,
  Response extends RuntimeChannelMessage = SettingsRuntimeMessageResponse,
  PortMessage = SettingsRuntimePortMessage,
>(
  config: RuntimeTransportConfig = settingsRuntimeTransportConfig
): RuntimeMessageTransport<Request, Response, PortMessage> | null => {
  const browserRuntime = globalThis.chrome?.runtime;
  if (browserRuntime) {
    return createExtensionRuntimeTransport<Request, Response, PortMessage>(browserRuntime, config);
  }

  const runtime = (globalThis as { browser?: { runtime?: ExtensionRuntimeApi } }).browser?.runtime;
  if (!runtime) {
    return null;
  }

  return createExtensionRuntimeTransport<Request, Response, PortMessage>(runtime, config);
};
