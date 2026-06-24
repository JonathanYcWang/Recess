import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import {
  TASK_LIST_RUNTIME_CHANNEL,
  TASK_LIST_RUNTIME_PORT_NAME,
  isTaskListRuntimePortMessage,
  isTaskListRuntimeRequest,
  type TaskListRuntimeMessageResponse,
} from '../messaging/taskListMessages';
import type { ExtensionRuntimePort } from '../messaging/extensionRuntimeApi';
import type { TaskListCommandHandler } from '../taskListTypes';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';

type RuntimeListenerRegistration = {
  handler: TaskListCommandHandler;
};

let registration: RuntimeListenerRegistration | null = null;
let listenerRegistered = false;
let rootReady: Promise<void> = Promise.resolve();

const handleRequest = async (
  message: Parameters<typeof isTaskListRuntimeRequest>[0]
): Promise<TaskListRuntimeMessageResponse> => {
  if (!isTaskListRuntimeRequest(message)) {
    return {
      channel: TASK_LIST_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  if (!registration) {
    return {
      channel: TASK_LIST_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    };
  }

  try {
    if (message.action === 'current') {
      return {
        channel: TASK_LIST_RUNTIME_CHANNEL,
        ok: true,
        action: 'current',
        result: registration.handler.current(),
      };
    }
    const result = await registration.handler.execute(message.envelope);
    return {
      channel: TASK_LIST_RUNTIME_CHANNEL,
      ok: true,
      action: 'command',
      result,
    };
  } catch {
    return {
      channel: TASK_LIST_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
};

const attachPort = (port: ExtensionRuntimePort) => {
  if (port.name !== TASK_LIST_RUNTIME_PORT_NAME) {
    return;
  }
  if (!registration) {
    port.disconnect();
    return;
  }

  const publishCurrent = () => {
    const current = registration?.handler.current();
    if (!current?.ok) {
      return;
    }
    try {
      port.postMessage({
        channel: TASK_LIST_RUNTIME_CHANNEL,
        action: 'snapshot',
        snapshot: current.value,
      });
    } catch {
      port.disconnect();
    }
  };

  const unsubscribe = registration.handler.subscribe(() => {
    publishCurrent();
  });

  const onPortMessage = (message: unknown) => {
    if (!isTaskListRuntimePortMessage(message) || message.action !== 'subscribe') {
      return;
    }
    publishCurrent();
  };

  port.onMessage.addListener(onPortMessage);
  port.onDisconnect.addListener(() => {
    unsubscribe();
    port.onMessage.removeListener(onPortMessage);
  });
};

export const registerTaskListRuntimeListener = (options: {
  adapter: KeyValueStorageAdapter;
  runtime: {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: TaskListRuntimeMessageResponse) => void
        ) => boolean | void
      ): void;
    };
    onConnect: {
      addListener(listener: (port: ExtensionRuntimePort) => void): void;
    };
  };
}): void => {
  if (listenerRegistered) {
    return;
  }
  listenerRegistered = true;

  rootReady = getSharedBackgroundCompositionRoot(options.adapter).then((root) => {
    if (!root.ok) {
      return;
    }
    registration = { handler: root.value.taskListHandler };
  });

  options.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isTaskListRuntimeRequest(message)) {
      return;
    }
    void rootReady.then(() => handleRequest(message)).then(sendResponse);
    return true;
  });

  options.runtime.onConnect.addListener((port) => {
    void rootReady.then(() => {
      attachPort(port);
    });
  });
};

export const resetTaskListRuntimeListenerForTests = (): void => {
  registration = null;
  listenerRegistered = false;
  rootReady = Promise.resolve();
};
