import type { KeyValueStorageAdapter } from '@/runtime/persistence';
import {
  SETTINGS_RUNTIME_CHANNEL,
  SETTINGS_RUNTIME_PORT_NAME,
  isSettingsRuntimePortMessage,
  isSettingsRuntimeRequest,
  type SettingsRuntimeMessageResponse,
} from '../messaging/messages';
import type { ExtensionRuntimePort } from '../messaging/extensionRuntimeApi';
import type { SettingsCommandHandler } from '../types';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';

type RuntimeListenerRegistration = {
  handler: SettingsCommandHandler;
};

let registration: RuntimeListenerRegistration | null = null;
let listenerRegistered = false;
let rootReady: Promise<void> = Promise.resolve();

const handleRequest = async (
  message: Parameters<typeof isSettingsRuntimeRequest>[0]
): Promise<SettingsRuntimeMessageResponse> => {
  if (!isSettingsRuntimeRequest(message)) {
    return {
      channel: SETTINGS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
  if (!registration) {
    return {
      channel: SETTINGS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'missing-receiver' },
    };
  }

  try {
    if (message.action === 'current') {
      return {
        channel: SETTINGS_RUNTIME_CHANNEL,
        ok: true,
        action: 'current',
        result: registration.handler.current(),
      };
    }
    const result = await registration.handler.execute(message.envelope);
    return {
      channel: SETTINGS_RUNTIME_CHANNEL,
      ok: true,
      action: 'command',
      result,
    };
  } catch {
    return {
      channel: SETTINGS_RUNTIME_CHANNEL,
      ok: false,
      error: { kind: 'malformed-payload' },
    };
  }
};

const attachPort = (port: ExtensionRuntimePort) => {
  if (port.name !== SETTINGS_RUNTIME_PORT_NAME) {
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
        channel: SETTINGS_RUNTIME_CHANNEL,
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
    if (!isSettingsRuntimePortMessage(message) || message.action !== 'subscribe') {
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

export const registerSettingsRuntimeListener = (options: {
  adapter: KeyValueStorageAdapter;
  runtime: {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: SettingsRuntimeMessageResponse) => void
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
    registration = { handler: root.value.settingsHandler };
  });

  options.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isSettingsRuntimeRequest(message)) {
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

export const resetSettingsRuntimeListenerForTests = (): void => {
  registration = null;
  listenerRegistered = false;
  rootReady = Promise.resolve();
};
