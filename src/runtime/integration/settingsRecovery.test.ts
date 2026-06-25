import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';
import { createDefaultSettingsValue } from '@/modules/persisted-application-state/settings/settingsDocument';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';
import {
  registerSettingsRuntimeListener,
  resetSettingsRuntimeListenerForTests,
} from '@/runtime/background/settingsRuntimeListener';
import { resetSharedBackgroundCompositionRootForTests } from '@/runtime/background/sharedCompositionRoot';
import {
  createInProcessRuntimeTransport,
  createMessagingSettingsClient,
} from '@/runtime/client/messagingSettingsClient';
import { createExtensionRuntimeTransport } from '@/runtime/messaging/extensionRuntimeTransport';
import type {
  ExtensionRuntimeApi,
  ExtensionRuntimePort,
} from '@/runtime/messaging/extensionRuntimeApi';
import { RUNTIME_PROTOCOL_VERSION } from '@/runtime/protocol/types';
import type { SettingsClient, SettingsCommandHandler } from '@/runtime/types';

type RecoveryFixture = {
  adapter: KeyValueStorageAdapter;
  createClient: () => Promise<SettingsClient>;
  restartWorker: () => Promise<SettingsClient>;
};

const commandEnvelope = (commandId: string) => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  commandId,
  module: 'settings' as const,
  command: { kind: 'unsupported-command' },
});

const malformedCommand = {
  ok: false as const,
  error: { kind: 'malformed-command' as const, message: 'unsupported Settings command kind' },
};

const commitSettings = async (
  adapter: KeyValueStorageAdapter,
  value: Partial<ReturnType<typeof createDefaultSettingsValue>>
) => {
  const persistence = createPersistedApplicationState({ adapter });
  await persistence.initialize();
  return persistence.commit([
    {
      document: 'settings',
      expectedRevision: 0,
      value: { ...createDefaultSettingsValue(), ...value },
    },
  ]);
};

const createMockExtensionRuntime = () => {
  const onMessageListeners = new Set<
    (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean | void
  >();
  const onConnectListeners = new Set<(port: ExtensionRuntimePort) => void>();

  const runtime = {
    onMessage: {
      addListener(
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void
        ) => boolean | void
      ) {
        onMessageListeners.add(listener);
      },
    },
    onConnect: {
      addListener(listener: (port: ExtensionRuntimePort) => void) {
        onConnectListeners.add(listener);
      },
    },
    async sendMessage(message: unknown) {
      if (onMessageListeners.size === 0) {
        return undefined;
      }
      return new Promise<unknown>((resolve) => {
        for (const listener of onMessageListeners) {
          listener(message, {}, resolve);
        }
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
      for (const listener of onConnectListeners) {
        listener(port);
      }
      return port;
    },
    get lastError() {
      return undefined;
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

const createInProcessRecoveryFixture = async (): Promise<RecoveryFixture> => {
  const adapter = createInMemoryKeyValueAdapter();
  let root = await createBackgroundCompositionRoot({ adapter });
  if (!root.ok) {
    throw new Error('expected runtime initialization to succeed');
  }

  const clientFromHandler = (handler: SettingsCommandHandler) =>
    createMessagingSettingsClient(createInProcessRuntimeTransport(handler));

  let client = clientFromHandler(root.value.settingsHandler);

  return {
    adapter,
    createClient: async () => client,
    restartWorker: async () => {
      root = await createBackgroundCompositionRoot({ adapter });
      if (!root.ok) {
        throw new Error('expected runtime reconstruction to succeed');
      }
      client = clientFromHandler(root.value.settingsHandler);
      return client;
    },
  };
};

const createExtensionRecoveryFixture = async (): Promise<RecoveryFixture> => {
  const adapter = createInMemoryKeyValueAdapter();
  const runtime = createMockExtensionRuntime();
  let transport = createExtensionRuntimeTransport(runtime);

  const registerWorker = () => {
    resetSettingsRuntimeListenerForTests();
    resetSharedBackgroundCompositionRootForTests();
    registerSettingsRuntimeListener({ adapter, runtime });
  };

  registerWorker();
  let client = createMessagingSettingsClient(transport);
  await vi.waitFor(async () => (await client.current()).ok);

  return {
    adapter,
    createClient: async () => client,
    restartWorker: async () => {
      registerWorker();
      transport = createExtensionRuntimeTransport(runtime);
      client = createMessagingSettingsClient(transport);
      await vi.waitFor(async () => (await client.current()).ok);
      return client;
    },
  };
};

const describeSettingsRecoveryMatrix = (
  suiteName: string,
  createFixture: () => Promise<RecoveryFixture>
): void => {
  describe(`settings recovery matrix (${suiteName})`, () => {
    afterEach(() => {
      resetSettingsRuntimeListenerForTests();
      resetSharedBackgroundCompositionRootForTests();
    });

    it('reconstructs the same Settings snapshot and revision from durable documents', async () => {
      const fixture = await createFixture();
      await commitSettings(fixture.adapter, { hasOnboarded: true });

      const restarted = await fixture.restartWorker();
      const current = await restarted.current();
      expect(current).toMatchObject({
        ok: true,
        value: {
          revision: 1,
          value: { hasOnboarded: true },
        },
      });
    });

    it('returns one committed outcome for duplicate delivery before restart', async () => {
      const fixture = await createFixture();
      const client = await fixture.createClient();
      const envelope = commandEnvelope('cmd-duplicate-before');
      const first = await client.command(envelope);
      const second = await client.command(envelope);
      expect(first).toEqual(second);
      expect(first).toEqual(malformedCommand);
    });

    it('returns one committed outcome for duplicate delivery after restart', async () => {
      const fixture = await createFixture();
      const client = await fixture.createClient();
      const envelope = commandEnvelope('cmd-duplicate-after');
      const first = await client.command(envelope);
      expect(first).toEqual(malformedCommand);

      const restarted = await fixture.restartWorker();
      const replay = await restarted.command(envelope);
      expect(replay).toEqual(first);
    });

    it('resubscribes after worker restart without losing the latest snapshot', async () => {
      const fixture = await createFixture();
      await commitSettings(fixture.adapter, { hasOnboarded: true });

      const restarted = await fixture.restartWorker();
      const unsubscribe = restarted.subscribe(() => undefined);

      const current = await restarted.current();
      expect(current).toMatchObject({
        ok: true,
        value: { revision: 1, value: { hasOnboarded: true } },
      });
      unsubscribe();
    });
  });
};

describeSettingsRecoveryMatrix('in-process transport', createInProcessRecoveryFixture);
describeSettingsRecoveryMatrix('chromium transport', createExtensionRecoveryFixture);
describeSettingsRecoveryMatrix('safari-compatible transport', createExtensionRecoveryFixture);
