import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';
import {
  createInProcessRuntimeTransport,
  createMessagingSettingsClient,
} from '@/runtime/client/messagingSettingsClient';
import { describeSettingsClientContractTests } from '@/runtime/integration/settingsClientContractTests';
import { createExtensionRuntimeTransport } from '@/runtime/messaging/extensionRuntimeTransport';
import type {
  ExtensionRuntimeApi,
  ExtensionRuntimePort,
} from '@/runtime/messaging/extensionRuntimeApi';
import {
  registerSettingsRuntimeListener,
  resetSettingsRuntimeListenerForTests,
} from '@/runtime/background/settingsRuntimeListener';
import * as compositionRootModule from '@/runtime/background/backgroundCompositionRoot';

const createInProcessMessagingClient = async () => {
  const root = await createBackgroundCompositionRoot({
    adapter: createInMemoryKeyValueAdapter(),
  });
  if (!root.ok) {
    throw new Error('expected runtime initialization to succeed');
  }
  return createMessagingSettingsClient(createInProcessRuntimeTransport(root.value.settingsHandler));
};

describeSettingsClientContractTests('in-process transport', createInProcessMessagingClient);

const createMockExtensionRuntime = (options?: { lastError?: { message: string } }) => {
  let onMessage:
    | ((
        message: unknown,
        sender: unknown,
        sendResponse: (response: unknown) => void
      ) => boolean | void)
    | null = null;
  let onConnect: ((port: ExtensionRuntimePort) => void) | null = null;

  const runtime = {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void
        ) => boolean | void
      ) {
        onMessage = listener;
      },
    },
    onConnect: {
      addListener(listener: (port: ExtensionRuntimePort) => void) {
        onConnect = listener;
      },
    },
    async sendMessage(message: unknown) {
      if (options?.lastError) {
        return undefined;
      }
      if (!onMessage) {
        return undefined;
      }
      return new Promise<unknown>((resolve) => {
        onMessage?.(message, {}, resolve);
      });
    },
    connect({ name }: { name: string }) {
      const messageListeners = new Set<(message: unknown) => void>();
      const disconnectListeners = new Set<() => void>();
      const port: ExtensionRuntimePort = {
        name,
        postMessage(message: unknown) {
          for (const listener of messageListeners) {
            listener(message);
          }
        },
        disconnect() {
          for (const listener of disconnectListeners) {
            listener();
          }
        },
        onMessage: {
          addListener(listener: (message: unknown) => void) {
            messageListeners.add(listener);
          },
          removeListener(listener: (message: unknown) => void) {
            messageListeners.delete(listener);
          },
        },
        onDisconnect: {
          addListener(listener: () => void) {
            disconnectListeners.add(listener);
          },
          removeListener(listener: () => void) {
            disconnectListeners.delete(listener);
          },
        },
      };
      onConnect?.(port);
      return port;
    },
    get lastError() {
      return options?.lastError;
    },
  } satisfies ExtensionRuntimeApi & {
    onMessage: {
      addListener: (
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void
        ) => boolean | void
      ) => void;
    };
    onConnect: { addListener: (listener: (port: ExtensionRuntimePort) => void) => void };
  };

  return runtime;
};

const createExtensionMessagingClient = async () => {
  resetSettingsRuntimeListenerForTests();
  const runtime = createMockExtensionRuntime();
  registerSettingsRuntimeListener({
    adapter: createInMemoryKeyValueAdapter(),
    runtime,
  });
  const client = createMessagingSettingsClient(createExtensionRuntimeTransport(runtime));
  await vi.waitFor(async () => (await client.current()).ok);
  return client;
};

describe('extension runtime messaging', () => {
  afterEach(() => {
    resetSettingsRuntimeListenerForTests();
    vi.restoreAllMocks();
  });

  describeSettingsClientContractTests('chromium transport', createExtensionMessagingClient);
  describeSettingsClientContractTests(
    'safari-compatible transport',
    createExtensionMessagingClient
  );

  it('registers the listener only once', async () => {
    const createRoot = vi.spyOn(compositionRootModule, 'createBackgroundCompositionRoot');
    resetSettingsRuntimeListenerForTests();
    const runtime = createMockExtensionRuntime();
    const adapter = createInMemoryKeyValueAdapter();

    registerSettingsRuntimeListener({ adapter, runtime });
    registerSettingsRuntimeListener({ adapter, runtime });

    await vi.waitFor(() => createRoot.mock.calls.length > 0);
    expect(createRoot).toHaveBeenCalledTimes(1);
  });

  it('returns missing-receiver when no background listener is registered', async () => {
    const runtime = createMockExtensionRuntime();
    const client = createMessagingSettingsClient(createExtensionRuntimeTransport(runtime));
    const current = await client.current();
    expect(current).toEqual({
      ok: false,
      error: { kind: 'missing-receiver' },
    });
  });

  it('maps closed-channel transport failures', async () => {
    const runtime = createMockExtensionRuntime({
      lastError: { message: 'The message port closed before a response was received.' },
    });
    const client = createMessagingSettingsClient(createExtensionRuntimeTransport(runtime));
    const current = await client.current();
    expect(current).toEqual({
      ok: false,
      error: { kind: 'closed-channel' },
    });
  });

  it('maps extension shutdown transport failures', async () => {
    const runtime = createMockExtensionRuntime({
      lastError: { message: 'Extension context invalidated' },
    });
    const client = createMessagingSettingsClient(createExtensionRuntimeTransport(runtime));
    const current = await client.current();
    expect(current).toEqual({
      ok: false,
      error: { kind: 'extension-shutdown' },
    });
  });

  it('maps malformed payload responses', async () => {
    const runtime = createMockExtensionRuntime();
    runtime.sendMessage = vi.fn(async () => ({ unexpected: true }));
    const client = createMessagingSettingsClient(createExtensionRuntimeTransport(runtime));
    const current = await client.current();
    expect(current).toEqual({
      ok: false,
      error: { kind: 'malformed-payload' },
    });
  });

  it('never exposes raw browser objects in responses', async () => {
    const client = await createExtensionMessagingClient();
    const current = await client.current();
    expect(current.ok).toBe(true);
    if (current.ok) {
      expect(JSON.stringify(current.value)).not.toContain('[object Object]');
    }
  });
});
