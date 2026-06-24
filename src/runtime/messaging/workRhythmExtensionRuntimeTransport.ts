import {
  WORK_RHYTHM_RUNTIME_CHANNEL,
  WORK_RHYTHM_RUNTIME_PORT_NAME,
  type WorkRhythmRuntimeMessagePort,
  type WorkRhythmRuntimeMessageResponse,
  type WorkRhythmRuntimeMessageTransport,
  type WorkRhythmRuntimePortMessage,
  type WorkRhythmRuntimeRequest,
} from './workRhythmMessages';
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
  if (message.includes('Extension context invalidated')) {
    return { kind: 'extension-shutdown' as const };
  }
  return { kind: 'closed-channel' as const };
};

const parseMessageResponse = (payload: unknown): WorkRhythmRuntimeMessageResponse => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('channel' in payload) ||
    (payload as { channel: string }).channel !== WORK_RHYTHM_RUNTIME_CHANNEL
  ) {
    return {
      channel: WORK_RHYTHM_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  return payload as WorkRhythmRuntimeMessageResponse;
};

const createRuntimePort = (port: ExtensionRuntimePort): WorkRhythmRuntimeMessagePort => {
  const messageListeners = new Set<(message: WorkRhythmRuntimePortMessage) => void>();
  const disconnectListeners = new Set<() => void>();

  const onMessage = (message: unknown) => {
    if (!message || typeof message !== 'object') {
      return;
    }
    for (const listener of messageListeners) {
      listener(message as WorkRhythmRuntimePortMessage);
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

export const createWorkRhythmExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): WorkRhythmRuntimeMessageTransport => ({
  async send(request: WorkRhythmRuntimeRequest): Promise<WorkRhythmRuntimeMessageResponse> {
    try {
      const response = await runtime.sendMessage(request);
      if (runtime.lastError) {
        return {
          channel: WORK_RHYTHM_RUNTIME_CHANNEL,
          ok: false,
          error: toTransportError(runtime),
        };
      }
      if (response === undefined) {
        return {
          channel: WORK_RHYTHM_RUNTIME_CHANNEL,
          ok: false,
          error: { kind: 'missing-receiver' },
        };
      }
      return parseMessageResponse(response);
    } catch {
      return {
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        ok: false,
        error: toTransportError(runtime),
      };
    }
  },
  connect() {
    const port = runtime.connect({ name: WORK_RHYTHM_RUNTIME_PORT_NAME });
    return createRuntimePort(port);
  },
});

export const createWorkRhythmSafariCompatibleRuntimeTransport =
  (): WorkRhythmRuntimeMessageTransport | null => {
    const browserRuntime = (globalThis as { browser?: { runtime?: ExtensionRuntimeApi } }).browser
      ?.runtime;
    if (
      browserRuntime &&
      typeof browserRuntime.sendMessage === 'function' &&
      typeof browserRuntime.connect === 'function'
    ) {
      return createWorkRhythmExtensionRuntimeTransport(browserRuntime);
    }
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage || !runtime.connect) {
      return null;
    }
    return createWorkRhythmExtensionRuntimeTransport({
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
