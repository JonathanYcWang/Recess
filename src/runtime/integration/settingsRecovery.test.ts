import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';
import { createBackgroundCompositionRoot } from '@/runtime/background/backgroundCompositionRoot';
import { createSettingsCommandHandler } from '@/runtime/background/settingsCommandHandler';
import {
  registerSettingsRuntimeListener,
  resetSettingsRuntimeListenerForTests,
} from '@/runtime/background/settingsRuntimeListener';
import {
  createInProcessRuntimeTransport,
  createMessagingSettingsClient,
} from '@/runtime/client/messagingSettingsClient';
import { createCommandOutcomeStore } from '@/runtime/commandOutcomeStore';
import { createEffectExecutor } from '@/runtime/effects/effectExecutor';
import { createEffectOutcomeStore } from '@/runtime/effects/effectOutcomeStore';
import { createFixtureEffectAdapter } from '@/runtime/effects/integration/fixtureEffectAdapter';
import { createExtensionRuntimeTransport } from '@/runtime/messaging/extensionRuntimeTransport';
import type {
  ExtensionRuntimeApi,
  ExtensionRuntimePort,
} from '@/runtime/messaging/extensionRuntimeApi';
import { RUNTIME_PROTOCOL_VERSION } from '@/runtime/protocol/types';
import type {
  SettingsClient,
  SettingsCommandHandler,
  SettingsCommandResponse,
} from '@/runtime/types';

type RecoveryFixture = {
  adapter: KeyValueStorageAdapter;
  createClient: () => Promise<SettingsClient>;
  restartWorker: () => Promise<SettingsClient>;
};

const commandEnvelope = (
  commandId: string,
  options?: { preference?: 'dark' | 'light'; expectedRevision?: number }
) => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  commandId,
  module: 'settings' as const,
  expectedRevision: options?.expectedRevision,
  command: {
    kind: 'set-theme-preference' as const,
    preference: options?.preference ?? 'dark',
  },
});

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

  let client = clientFromHandler(root.value.handler);

  return {
    adapter,
    createClient: async () => client,
    restartWorker: async () => {
      root = await createBackgroundCompositionRoot({ adapter });
      if (!root.ok) {
        throw new Error('expected runtime reconstruction to succeed');
      }
      client = clientFromHandler(root.value.handler);
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
    });

    it('reconstructs the same Settings snapshot and revision from durable documents', async () => {
      const fixture = await createFixture();
      const client = await fixture.createClient();
      const committed = await client.setThemePreference('dark');
      expect(committed.ok).toBe(true);

      const restarted = await fixture.restartWorker();
      const current = await restarted.current();
      expect(current).toMatchObject({
        ok: true,
        value: {
          revision: 1,
          value: { themePreference: 'dark' },
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

      const current = await client.current();
      expect(current).toMatchObject({
        ok: true,
        value: { revision: 1, value: { themePreference: 'dark' } },
      });
    });

    it('returns one committed outcome for duplicate delivery after restart', async () => {
      const fixture = await createFixture();
      const client = await fixture.createClient();
      const envelope = commandEnvelope('cmd-duplicate-after');
      const first = await client.command(envelope);
      expect(first.ok).toBe(true);

      const restarted = await fixture.restartWorker();
      const replay = await restarted.command(envelope);
      expect(replay).toEqual(first);

      const current = await restarted.current();
      expect(current).toMatchObject({
        ok: true,
        value: { revision: 1, value: { themePreference: 'dark' } },
      });
    });

    it('fails stale revisions safely and lets current recover the client', async () => {
      const fixture = await createFixture();
      const client = await fixture.createClient();
      const stale = await client.command(commandEnvelope('cmd-stale', { expectedRevision: 9 }));
      expect(stale).toEqual({
        ok: false,
        error: { kind: 'stale-revision', expectedRevision: 9, actualRevision: 0 },
      });

      const current = await client.current();
      expect(current.ok).toBe(true);
      if (!current.ok) {
        return;
      }

      const recovered = await client.command(
        commandEnvelope('cmd-recover', {
          preference: 'light',
          expectedRevision: current.value.revision,
        })
      );
      expect(recovered).toMatchObject({
        ok: true,
        revision: 1,
        snapshot: { value: { themePreference: 'light' } },
      });
    });

    it('resubscribes after worker restart without losing the latest snapshot', async () => {
      const fixture = await createFixture();
      const client = await fixture.createClient();
      await client.setThemePreference('dark');

      const restarted = await fixture.restartWorker();
      const unsubscribe = restarted.subscribe(() => undefined);

      const current = await restarted.current();
      expect(current).toMatchObject({
        ok: true,
        value: { revision: 1, value: { themePreference: 'dark' } },
      });
      unsubscribe();
    });
  });
};

describeSettingsRecoveryMatrix('in-process transport', createInProcessRecoveryFixture);
describeSettingsRecoveryMatrix('chromium transport', createExtensionRecoveryFixture);
describeSettingsRecoveryMatrix('safari-compatible transport', createExtensionRecoveryFixture);

describe('settings recovery matrix (journal and pending effects)', () => {
  it('rolls forward pending effects after journal recovery without duplicate delivery', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    const initialized = await persistence.initialize();
    if (!initialized.ok) {
      throw new Error('expected initialization to succeed');
    }

    const fixtureAdapter = createFixtureEffectAdapter({
      failIntentIds: new Set(['effect-cmd-journal-recovery']),
    });
    const store = createEffectOutcomeStore(adapter);
    const executor = createEffectExecutor({
      store,
      adapters: [fixtureAdapter],
    });
    const outcomeStore = createCommandOutcomeStore<SettingsCommandResponse>(adapter);
    const handler = createSettingsCommandHandler(
      persistence,
      initialized.value.documents.settings,
      {
        effectExecutor: executor,
        outcomeStore,
      }
    );

    const response = await handler.execute(commandEnvelope('cmd-journal-recovery'));
    expect(response.ok).toBe(true);
    expect(fixtureAdapter.deliveredIntentIds).toEqual([]);

    const reinitialized = await persistence.initialize();
    if (!reinitialized.ok) {
      throw new Error('expected reinitialization to succeed');
    }
    const reconstructedExecutor = createEffectExecutor({
      store: createEffectOutcomeStore(adapter),
      adapters: [
        createFixtureEffectAdapter({
          deliveredIntentIds: [...fixtureAdapter.deliveredIntentIds],
        }),
      ],
    });
    const rolledForward = await reconstructedExecutor.rollForwardPending();
    expect(rolledForward).toHaveLength(1);
    expect(rolledForward[0]?.phase).toBe('completed');

    const reconstructedHandler = createSettingsCommandHandler(
      persistence,
      reinitialized.value.documents.settings,
      { effectExecutor: reconstructedExecutor, outcomeStore }
    );
    const current = reconstructedHandler.current();
    expect(current).toMatchObject({
      ok: true,
      value: { revision: 1, value: { themePreference: 'dark' } },
    });

    const replay = await reconstructedHandler.execute(commandEnvelope('cmd-journal-recovery'));
    expect(replay).toEqual(response);
  });
});
