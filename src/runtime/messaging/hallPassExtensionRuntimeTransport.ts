import {
  HALL_PASS_RUNTIME_CHANNEL,
  HALL_PASS_RUNTIME_PORT_NAME,
  type HallPassRuntimeMessagePort,
  type HallPassRuntimeMessageResponse,
  type HallPassRuntimeMessageTransport,
  type HallPassRuntimePortMessage,
  type HallPassRuntimeRequest,
} from './hallPassMessages';
import type { ExtensionRuntimeApi, ExtensionRuntimePort } from './extensionRuntimeApi';

const toTransportError = (runtime: ExtensionRuntimeApi) => {
  const message = runtime.lastError?.message ?? '';
  if (
    message.includes('Receiving end does not exist') ||
    message.includes('Could not establish connection')
  ) {
    return { kind: 'missing-receiver' as const };
  }
  if (message.includes('message port closed')) {
    return { kind: 'closed-channel' as const };
  }
  if (message.includes('extension-shutdown') || message.includes('Extension context invalidated')) {
    return { kind: 'extension-shutdown' as const };
  }
  return { kind: 'closed-channel' as const };
};

const parseMessageResponse = (payload: unknown): HallPassRuntimeMessageResponse => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('channel' in payload) ||
    (payload as { channel: string }).channel !== HALL_PASS_RUNTIME_CHANNEL
  ) {
    return {
      channel: HALL_PASS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  return payload as HallPassRuntimeMessageResponse;
};

const createRuntimePort = (port: ExtensionRuntimePort): HallPassRuntimeMessagePort => {
  const messageListeners = new Set<(message: HallPassRuntimePortMessage) => void>();
  const disconnectListeners = new Set<() => void>();

  const onMessage = (message: unknown) => {
    if (!message || typeof message !== 'object') {
      return;
    }
    for (const listener of messageListeners) {
      listener(message as HallPassRuntimePortMessage);
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

export const createHallPassExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): HallPassRuntimeMessageTransport => ({
  async send(request: HallPassRuntimeRequest): Promise<HallPassRuntimeMessageResponse> {
    try {
      const response = await runtime.sendMessage(request);
      if (runtime.lastError) {
        return {
          channel: HALL_PASS_RUNTIME_CHANNEL,
          ok: false,
          error: toTransportError(runtime),
        };
      }
      if (response === undefined) {
        return {
          channel: HALL_PASS_RUNTIME_CHANNEL,
          ok: false,
          error: { kind: 'missing-receiver' },
        };
      }
      return parseMessageResponse(response);
    } catch {
      return {
        channel: HALL_PASS_RUNTIME_CHANNEL,
        ok: false,
        error: toTransportError(runtime),
      };
    }
  },
  connect() {
    const port = runtime.connect({ name: HALL_PASS_RUNTIME_PORT_NAME });
    return createRuntimePort(port);
  },
});

export const createHallPassSafariCompatibleRuntimeTransport =
  (): HallPassRuntimeMessageTransport | null => {
    const browserRuntime = (globalThis as { browser?: { runtime?: ExtensionRuntimeApi } }).browser
      ?.runtime;
    if (
      browserRuntime &&
      typeof browserRuntime.sendMessage === 'function' &&
      typeof browserRuntime.connect === 'function'
    ) {
      return createHallPassExtensionRuntimeTransport(browserRuntime);
    }
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage || !runtime.connect) {
      return null;
    }
    return createHallPassExtensionRuntimeTransport({
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
