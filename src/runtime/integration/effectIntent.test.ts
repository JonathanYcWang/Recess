import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';
import { createSettingsCommandHandler } from '@/runtime/background/settingsCommandHandler';
import { createEffectExecutor } from '@/runtime/effects/effectExecutor';
import { createEffectOutcomeStore } from '@/runtime/effects/effectOutcomeStore';
import { createFixtureEffectAdapter } from '@/runtime/effects/integration/fixtureEffectAdapter';
import { createSettingsEffectIntent } from '@/runtime/effects/settingsEffectTransition';

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
  const handler = createSettingsCommandHandler(persistence, initialized.value.documents.settings);
  return { handler, executor, fixtureAdapter, adapter, persistence, store };
};

describe('effect intent lifecycle', () => {
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
