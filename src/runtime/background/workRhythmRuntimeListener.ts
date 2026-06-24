import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import {
  WORK_RHYTHM_RUNTIME_CHANNEL,
  WORK_RHYTHM_RUNTIME_PORT_NAME,
  isWorkRhythmRuntimePortMessage,
  isWorkRhythmRuntimeRequest,
  type WorkRhythmRuntimeMessageResponse,
} from '../messaging/workRhythmMessages';
import type { ExtensionRuntimePort } from '../messaging/extensionRuntimeApi';
import type { WorkRhythmCommandHandler } from '../workRhythmTypes';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';

type RuntimeListenerRegistration = {
  handler: WorkRhythmCommandHandler;
};

let registration: RuntimeListenerRegistration | null = null;
let listenerRegistered = false;
let rootReady: Promise<void> = Promise.resolve();

const handleRequest = async (
  message: Parameters<typeof isWorkRhythmRuntimeRequest>[0]
): Promise<WorkRhythmRuntimeMessageResponse> => {
  if (!isWorkRhythmRuntimeRequest(message)) {
    return {
      channel: WORK_RHYTHM_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  if (!registration) {
    return {
      channel: WORK_RHYTHM_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    };
  }

  try {
    if (message.action === 'current') {
      return {
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
        ok: true,
        action: 'current',
        result: registration.handler.current(),
      };
    }
    const result = await registration.handler.execute(message.envelope);
    return {
      channel: WORK_RHYTHM_RUNTIME_CHANNEL,
      ok: true,
      action: 'command',
      result,
    };
  } catch {
    return {
      channel: WORK_RHYTHM_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
};

const attachPort = (port: ExtensionRuntimePort) => {
  if (port.name !== WORK_RHYTHM_RUNTIME_PORT_NAME) {
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
        channel: WORK_RHYTHM_RUNTIME_CHANNEL,
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
    if (!isWorkRhythmRuntimePortMessage(message) || message.action !== 'subscribe') {
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

export const registerWorkRhythmRuntimeListener = (options: {
  adapter: KeyValueStorageAdapter;
  runtime: {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: WorkRhythmRuntimeMessageResponse) => void
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
    registration = { handler: root.value.workRhythmHandler };
  });

  options.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isWorkRhythmRuntimeRequest(message)) {
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

export const resetWorkRhythmRuntimeListenerForTests = (): void => {
  registration = null;
  listenerRegistered = false;
  rootReady = Promise.resolve();
};
