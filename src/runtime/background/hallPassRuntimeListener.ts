import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import {
  HALL_PASS_RUNTIME_CHANNEL,
  HALL_PASS_RUNTIME_PORT_NAME,
  isHallPassRuntimePortMessage,
  isHallPassRuntimeRequest,
  type HallPassRuntimeMessageResponse,
} from '../messaging/hallPassMessages';
import type { ExtensionRuntimePort } from '../messaging/extensionRuntimeApi';
import type { HallPassCommandHandler } from '../hallPassTypes';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';

type RuntimeListenerRegistration = {
  handler: HallPassCommandHandler;
};

let registration: RuntimeListenerRegistration | null = null;
let listenerRegistered = false;
let rootReady: Promise<void> = Promise.resolve();

const handleRequest = async (
  message: Parameters<typeof isHallPassRuntimeRequest>[0]
): Promise<HallPassRuntimeMessageResponse> => {
  if (!isHallPassRuntimeRequest(message)) {
    return {
      channel: HALL_PASS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  if (!registration) {
    return {
      channel: HALL_PASS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    };
  }

  try {
    if (message.action === 'current') {
      return {
        channel: HALL_PASS_RUNTIME_CHANNEL,
        ok: true,
        action: 'current',
        result: registration.handler.current(),
      };
    }
    const result = await registration.handler.execute(message.envelope);
    return {
      channel: HALL_PASS_RUNTIME_CHANNEL,
      ok: true,
      action: 'command',
      result,
    };
  } catch {
    return {
      channel: HALL_PASS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
};

const attachPort = (port: ExtensionRuntimePort) => {
  if (port.name !== HALL_PASS_RUNTIME_PORT_NAME) {
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
        channel: HALL_PASS_RUNTIME_CHANNEL,
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
    if (!isHallPassRuntimePortMessage(message) || message.action !== 'subscribe') {
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

export const registerHallPassRuntimeListener = (options: {
  adapter: KeyValueStorageAdapter;
  runtime: {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: HallPassRuntimeMessageResponse) => void
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
    registration = { handler: root.value.hallPassHandler };
  });

  options.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isHallPassRuntimeRequest(message)) {
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

export const resetHallPassRuntimeListenerForTests = (): void => {
  registration = null;
  listenerRegistered = false;
  rootReady = Promise.resolve();
};
