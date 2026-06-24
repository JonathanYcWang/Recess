import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';
import { createSettingsCommandHandler } from '@/runtime/background/settingsCommandHandler';
import { createEffectExecutor } from '@/runtime/effects/effectExecutor';
import { createEffectOutcomeStore } from '@/runtime/effects/effectOutcomeStore';
import { createFixtureEffectAdapter } from '@/runtime/effects/integration/fixtureEffectAdapter';
import { createSettingsEffectIntent } from '@/runtime/effects/settingsEffectTransition';
import { RUNTIME_PROTOCOL_VERSION } from '@/runtime/protocol/types';

const createHandlerWithEffects = async (options?: {
  hooks?: Parameters<typeof createEffectExecutor>[0]['hooks'];
  failIntentIds?: Set<string>;
}) => {
  const adapter = createInMemoryKeyValueAdapter();
  const persistence = createPersistedApplicationState({ adapter });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    throw new Error('expected initialization to succeed');
  }
  const fixtureAdapter = createFixtureEffectAdapter({
    failIntentIds: options?.failIntentIds,
  });
  const store = createEffectOutcomeStore(adapter);
  const executor = createEffectExecutor({
    store,
    adapters: [fixtureAdapter],
    hooks: options?.hooks,
  });
  const handler = createSettingsCommandHandler(persistence, initialized.value.documents.settings, {
    effectExecutor: executor,
  });
  return { handler, executor, fixtureAdapter, adapter, persistence, store };
};

const commandEnvelope = (commandId: string, preference: 'dark' | 'light' = 'dark') => ({
  protocolVersion: RUNTIME_PROTOCOL_VERSION,
  commandId,
  module: 'settings' as const,
  command: { kind: 'set-theme-preference' as const, preference },
});

describe('effect intent lifecycle', () => {
  it('persists pending state before external execution begins', async () => {
    let persistedBeforeExecute = false;
    const { handler, store } = await createHandlerWithEffects({
      hooks: {
        beforeExecute: async () => {
          const records = await store.list();
          expect(records).toHaveLength(1);
          expect(records[0]?.phase).toBe('pending-execution');
          persistedBeforeExecute = true;
        },
      },
    });

    const response = await handler.execute(commandEnvelope('cmd-persist-first'));
    expect(response.ok).toBe(true);
    expect(persistedBeforeExecute).toBe(true);
  });

  it('marks completion durably and retries pending work after reconstruction', async () => {
    const { handler, fixtureAdapter, adapter, persistence } = await createHandlerWithEffects({
      failIntentIds: new Set(['effect-cmd-retry']),
    });

    const response = await handler.execute(commandEnvelope('cmd-retry'));
    expect(response.ok).toBe(true);
    expect(fixtureAdapter.deliveredIntentIds).toEqual([]);

    await persistence.initialize();
    const retryAdapter = createFixtureEffectAdapter({
      deliveredIntentIds: [...fixtureAdapter.deliveredIntentIds],
    });
    const reconstructedExecutor = createEffectExecutor({
      store: createEffectOutcomeStore(adapter),
      adapters: [retryAdapter],
    });
    const records = await reconstructedExecutor.rollForwardPending();
    expect(records).toHaveLength(1);
    expect(records[0]?.phase).toBe('completed');
    expect(retryAdapter.deliveredIntentIds).toEqual(['effect-cmd-retry']);
  });

  it('delivers fixture effects exactly once across repeated execution', async () => {
    const { handler, executor, fixtureAdapter } = await createHandlerWithEffects();
    await handler.execute(commandEnvelope('cmd-idempotent'));
    await executor.executeIntent('effect-cmd-idempotent');
    expect(fixtureAdapter.deliveredIntentIds).toEqual(['effect-cmd-idempotent']);
  });

  it('interrupts before execution without completing the effect', async () => {
    const { store, executor } = await createHandlerWithEffects({
      hooks: {
        beforeExecute: async () => {
          throw new Error('interrupt before execution');
        },
      },
    });

    const intent = createSettingsEffectIntent({
      commandId: 'cmd-interrupt-before',
      preference: 'dark',
    });
    await executor.persistTransition({ intent, outcomeRevision: 1 });
    await expect(executor.executeIntent(intent.intentId)).rejects.toThrow(
      'interrupt before execution'
    );
    const record = await store.getByIntentId(intent.intentId);
    expect(record?.phase).toBe('pending-execution');
  });

  it('interrupts during external failure without marking completion', async () => {
    const { store, executor } = await createHandlerWithEffects({
      failIntentIds: new Set(['effect-cmd-fail']),
    });

    const intent = createSettingsEffectIntent({
      commandId: 'cmd-fail',
      preference: 'dark',
    });
    await executor.persistTransition({ intent, outcomeRevision: 1 });
    await expect(executor.executeIntent(intent.intentId)).rejects.toThrow('fixture effect failed');
    const record = await store.getByIntentId(intent.intentId);
    expect(record?.phase).toBe('pending-execution');
  });

  it('interrupts after external success and before completion marking', async () => {
    const { store, executor } = await createHandlerWithEffects({
      hooks: {
        beforeMarkComplete: async () => {
          throw new Error('interrupt before completion');
        },
      },
    });

    const intent = createSettingsEffectIntent({
      commandId: 'cmd-interrupt-complete',
      preference: 'dark',
    });
    await executor.persistTransition({ intent, outcomeRevision: 1 });
    await expect(executor.executeIntent(intent.intentId)).rejects.toThrow(
      'interrupt before completion'
    );
    const record = await store.getByIntentId(intent.intentId);
    expect(record?.phase).toBe('pending-completion');
  });

  it('does not export the integration fixture from the runtime public entry', async () => {
    const runtime = await import('@/runtime');
    expect(runtime).not.toHaveProperty('createFixtureEffectAdapter');
    expect(runtime).not.toHaveProperty('INTEGRATION_FIXTURE_EFFECT_KIND');
  });
});
