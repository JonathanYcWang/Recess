import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import type { ExtensionRuntimePort } from '../messaging/extensionRuntimeApi';
import { getSharedBackgroundCompositionRoot } from './sharedCompositionRoot';

export type RuntimeCommandHandler<TSnapshot> = {
  current(): { ok: true; value: TSnapshot } | { ok: false; error: unknown };
  execute(envelope: unknown): Promise<unknown>;
  subscribe(listener: (snapshot: TSnapshot) => void): () => void;
};

type RuntimeAdapterOptions = {
  adapter: KeyValueStorageAdapter;
  runtime: {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void
        ) => boolean | void
      ): void;
    };
    onConnect: {
      addListener(listener: (port: ExtensionRuntimePort) => void): void;
    };
  };
};

type RequestLike = { action: string; envelope?: unknown };
type PortMessageLike = { action: string };

export type CreateRuntimeListenerConfig<TSnapshot> = {
  channel: string;
  portName: string;
  isRequest: (message: unknown) => boolean;
  isPortMessage: (message: unknown) => boolean;
  buildHandler: (
    root: import('./backgroundCompositionRoot').BackgroundCompositionRoot
  ) => RuntimeCommandHandler<TSnapshot>;
};

export type RuntimeListener = {
  register(options: RuntimeAdapterOptions): void;
  resetForTests(): void;
};

export const createRuntimeListener = <TSnapshot>(
  config: CreateRuntimeListenerConfig<TSnapshot>
): RuntimeListener => {
  let registration: RuntimeCommandHandler<TSnapshot> | null = null;
  let listenerRegistered = false;
  let rootReady: Promise<void> = Promise.resolve();

  const handleRequest = async (message: unknown): Promise<unknown> => {
    if (!config.isRequest(message)) {
      return {
        channel: config.channel,
        ok: false,
        error: { kind: 'malformed-payload' },
      };
    }
    if (!registration) {
      return {
        channel: config.channel,
        ok: false,
        error: { kind: 'missing-receiver' },
      };
    }

    try {
      const req = message as RequestLike;
      if (req.action === 'current') {
        const current = registration.current();
        return {
          channel: config.channel,
          ok: true,
          action: 'current',
          result: current,
        };
      }
      const result = await registration.execute(req.envelope);
      return {
        channel: config.channel,
        ok: true,
        action: 'command',
        result,
      };
    } catch {
      return {
        channel: config.channel,
        ok: false,
        error: { kind: 'malformed-payload' },
      };
    }
  };

  const attachPort = (port: ExtensionRuntimePort) => {
    if (port.name !== config.portName) {
      return;
    }
    if (!registration) {
      port.disconnect();
      return;
    }

    const publishCurrent = () => {
      const current = registration?.current();
      if (!current?.ok) {
        return;
      }
      try {
        port.postMessage({
          channel: config.channel,
          action: 'snapshot',
          snapshot: current.value,
        });
      } catch {
        port.disconnect();
      }
    };

    const unsubscribe = registration.subscribe(() => {
      publishCurrent();
    });

    const onPortMessage = (message: unknown) => {
      const pm = message as PortMessageLike;
      if (!config.isPortMessage(message) || pm.action !== 'subscribe') {
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

  return {
    register(options: RuntimeAdapterOptions): void {
      if (listenerRegistered) {
        return;
      }
      listenerRegistered = true;

      rootReady = getSharedBackgroundCompositionRoot(options.adapter).then((root) => {
        if (!root.ok) {
          return;
        }
        registration = config.buildHandler(root.value);
      });

      options.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (!config.isRequest(message)) {
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
    },

    resetForTests(): void {
      registration = null;
      listenerRegistered = false;
      rootReady = Promise.resolve();
    },
  };
};
