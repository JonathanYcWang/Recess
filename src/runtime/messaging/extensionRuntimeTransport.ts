import {
  SETTINGS_RUNTIME_CHANNEL,
  SETTINGS_RUNTIME_PORT_NAME,
  type SettingsRuntimeMessageResponse,
  type SettingsRuntimePortMessage,
  type SettingsRuntimeRequest,
  type SettingsRuntimeTransportError,
} from './messages';
import type { ExtensionRuntimeApi, ExtensionRuntimePort } from './extensionRuntimeApi';
import type { RuntimeMessagePort, RuntimeMessageTransport } from './runtimeTransport';

const toTransportError = (runtime: ExtensionRuntimeApi): SettingsRuntimeTransportError => {
  const message = runtime.lastError?.message ?? '';
  if (
    message.includes('Receiving end does not exist') ||
    message.includes('Could not establish connection')
  ) {
    return { kind: 'missing-receiver' };
  }
  if (message.includes('message port closed')) {
    return { kind: 'closed-channel' };
  }
  if (message.includes('Extension context invalidated')) {
    return { kind: 'extension-shutdown' };
  }
  return { kind: 'closed-channel' };
};

const parseMessageResponse = (payload: unknown): SettingsRuntimeMessageResponse => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('channel' in payload) ||
    (payload as { channel: string }).channel !== SETTINGS_RUNTIME_CHANNEL
  ) {
    return {
      channel: SETTINGS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  return payload as SettingsRuntimeMessageResponse;
};

const createRuntimePort = (port: ExtensionRuntimePort): RuntimeMessagePort => {
  const messageListeners = new Set<(message: SettingsRuntimePortMessage) => void>();
  const disconnectListeners = new Set<() => void>();

  const onMessage = (message: unknown) => {
    if (!message || typeof message !== 'object') {
      return;
    }
    for (const listener of messageListeners) {
      listener(message as SettingsRuntimePortMessage);
    }
  };
  const onDisconnect = () => {
    for (const listener of disconnectListeners) {
      listener();
    }
  };

  port.onMessage.addListener(onMessage);
  port.onDisconnect.addListener(onDisconnect);

  return {
    postMessage(message) {
      port.postMessage(message);
    },
    disconnect() {
      port.disconnect();
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
};

export const createExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): RuntimeMessageTransport => ({
  async send(request: SettingsRuntimeRequest): Promise<SettingsRuntimeMessageResponse> {
    try {
      const response = await runtime.sendMessage(request);
      if (runtime.lastError) {
        return {
          channel: SETTINGS_RUNTIME_CHANNEL,
          ok: false,
          error: toTransportError(runtime),
        };
      }
      if (response === undefined) {
        return {
          channel: SETTINGS_RUNTIME_CHANNEL,
          ok: false,
          error: { kind: 'missing-receiver' },
        };
      }
      return parseMessageResponse(response);
    } catch {
      return {
        channel: SETTINGS_RUNTIME_CHANNEL,
        ok: false,
        error: toTransportError(runtime),
      };
    }
  },
  connect() {
    const port = runtime.connect({ name: SETTINGS_RUNTIME_PORT_NAME });
    return createRuntimePort(port);
  },
});

export const createChromiumRuntimeTransport = (): RuntimeMessageTransport | null => {
  const runtime = globalThis.chrome?.runtime;
  if (!runtime?.sendMessage || !runtime.connect) {
    return null;
  }
  return createExtensionRuntimeTransport({
    sendMessage: (message) =>
      new Promise((resolve) => {
        runtime.sendMessage(message, (response) => {
          resolve(response);
        });
      }),
    connect: (options) => runtime.connect(options),
    get lastError() {
      const lastError = runtime.lastError;
      return lastError?.message ? { message: lastError.message } : undefined;
    },
  });
};

export const createSafariCompatibleRuntimeTransport = (): RuntimeMessageTransport | null => {
  const browserRuntime = (globalThis as { browser?: { runtime?: ExtensionRuntimeApi } }).browser
    ?.runtime;
  if (
    browserRuntime &&
    typeof browserRuntime.sendMessage === 'function' &&
    typeof browserRuntime.connect === 'function'
  ) {
    return createExtensionRuntimeTransport(browserRuntime);
  }
  return createChromiumRuntimeTransport();
};
