import type { KeyValueStorageAdapter } from '@/runtime/persistence';
import {
  WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
  WORKSTYLE_PROFILE_RUNTIME_PORT_NAME,
  isWorkstyleProfileRuntimePortMessage,
  isWorkstyleProfileRuntimeRequest,
  type WorkstyleProfileRuntimeMessageResponse,
} from '../messaging/workstyleProfileMessages';
import type { ExtensionRuntimePort } from '../messaging/extensionRuntimeApi';
import type { WorkstyleProfileCommandHandler } from '../workstyleProfileTypes';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';

type RuntimeListenerRegistration = {
  handler: WorkstyleProfileCommandHandler;
};

let registration: RuntimeListenerRegistration | null = null;
let listenerRegistered = false;
let rootReady: Promise<void> = Promise.resolve();

const handleRequest = async (
  message: Parameters<typeof isWorkstyleProfileRuntimeRequest>[0]
): Promise<WorkstyleProfileRuntimeMessageResponse> => {
  if (!isWorkstyleProfileRuntimeRequest(message)) {
    return {
      channel: WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  if (!registration) {
    return {
      channel: WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    };
  }

  try {
    if (message.action === 'current') {
      return {
        channel: WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
        ok: true,
        action: 'current',
        result: registration.handler.current(),
      };
    }
    const result = await registration.handler.execute(message.envelope);
    return {
      channel: WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
      ok: true,
      action: 'command',
      result,
    };
  } catch {
    return {
      channel: WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
};

const attachPort = (port: ExtensionRuntimePort) => {
  if (port.name !== WORKSTYLE_PROFILE_RUNTIME_PORT_NAME) {
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
        channel: WORKSTYLE_PROFILE_RUNTIME_CHANNEL,
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
    if (!isWorkstyleProfileRuntimePortMessage(message) || message.action !== 'subscribe') {
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

export const registerWorkstyleProfileRuntimeListener = (options: {
  adapter: KeyValueStorageAdapter;
  runtime: {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: WorkstyleProfileRuntimeMessageResponse) => void
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
    registration = { handler: root.value.workstyleProfileHandler };
  });

  options.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isWorkstyleProfileRuntimeRequest(message)) {
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

export const resetWorkstyleProfileRuntimeListenerForTests = (): void => {
  registration = null;
  listenerRegistered = false;
  rootReady = Promise.resolve();
};
