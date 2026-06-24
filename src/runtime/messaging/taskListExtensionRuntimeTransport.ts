import {
  TASK_LIST_RUNTIME_CHANNEL,
  TASK_LIST_RUNTIME_PORT_NAME,
  type TaskListRuntimeMessagePort,
  type TaskListRuntimeMessageResponse,
  type TaskListRuntimeMessageTransport,
  type TaskListRuntimePortMessage,
  type TaskListRuntimeRequest,
} from './taskListMessages';
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

const parseMessageResponse = (payload: unknown): TaskListRuntimeMessageResponse => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('channel' in payload) ||
    (payload as { channel: string }).channel !== TASK_LIST_RUNTIME_CHANNEL
  ) {
    return {
      channel: TASK_LIST_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  return payload as TaskListRuntimeMessageResponse;
};

const createRuntimePort = (port: ExtensionRuntimePort): TaskListRuntimeMessagePort => {
  const messageListeners = new Set<(message: TaskListRuntimePortMessage) => void>();
  const disconnectListeners = new Set<() => void>();

  const onMessage = (message: unknown) => {
    if (!message || typeof message !== 'object') {
      return;
    }
    for (const listener of messageListeners) {
      listener(message as TaskListRuntimePortMessage);
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

export const createTaskListExtensionRuntimeTransport = (
  runtime: ExtensionRuntimeApi
): TaskListRuntimeMessageTransport => ({
  async send(request: TaskListRuntimeRequest): Promise<TaskListRuntimeMessageResponse> {
    try {
      const response = await runtime.sendMessage(request);
      if (runtime.lastError) {
        return {
          channel: TASK_LIST_RUNTIME_CHANNEL,
          ok: false,
          error: toTransportError(runtime),
        };
      }
      if (response === undefined) {
        return {
          channel: TASK_LIST_RUNTIME_CHANNEL,
          ok: false,
          error: { kind: 'missing-receiver' },
        };
      }
      return parseMessageResponse(response);
    } catch {
      return {
        channel: TASK_LIST_RUNTIME_CHANNEL,
        ok: false,
        error: toTransportError(runtime),
      };
    }
  },
  connect() {
    const port = runtime.connect({ name: TASK_LIST_RUNTIME_PORT_NAME });
    return createRuntimePort(port);
  },
});

export const createTaskListSafariCompatibleRuntimeTransport =
  (): TaskListRuntimeMessageTransport | null => {
    const browserRuntime = (globalThis as { browser?: { runtime?: ExtensionRuntimeApi } }).browser
      ?.runtime;
    if (
      browserRuntime &&
      typeof browserRuntime.sendMessage === 'function' &&
      typeof browserRuntime.connect === 'function'
    ) {
      return createTaskListExtensionRuntimeTransport(browserRuntime);
    }
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage || !runtime.connect) {
      return null;
    }
    return createTaskListExtensionRuntimeTransport({
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
