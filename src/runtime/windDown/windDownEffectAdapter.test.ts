import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createEffectExecutor } from '../effects/effectExecutor';
import { createEffectOutcomeStore } from '../effects/effectOutcomeStore';
import { runWindDownEffectTransition } from './windDownEffectTransition';
import { createInMemoryWindDownNotificationAdapter } from './windDownNotificationAdapter';
import { createInMemoryWindDownSoundAdapter } from './windDownSoundAdapter';

describe('windDown effect adapters', () => {
  it('reports capability-unavailable failures through notification intents', async () => {
    const notificationAdapter = createInMemoryWindDownNotificationAdapter({
      capability: 'unsupported',
    });
    const executor = createEffectExecutor({
      store: createEffectOutcomeStore(createInMemoryKeyValueAdapter()),
      adapters: [notificationAdapter],
    });

    await expect(
      executor
        .persistTransition({
          intent: {
            intentId: 'effect-wind-down-1-wind-down.notification',
            commandId: 'wind-down-1',
            module: 'wind-down',
            kind: notificationAdapter.kind,
            facts: { sessionId: 'ws-1', phaseKind: 'focus-block', remainingSeconds: '120' },
          },
          outcomeRevision: 1,
        })
        .then((record) => executor.executeIntent(record.intentId))
    ).rejects.toThrow('capability-unavailable');
  });

  it('plays sound only when the settings preference is enabled', async () => {
    const notificationAdapter = createInMemoryWindDownNotificationAdapter();
    const soundAdapter = createInMemoryWindDownSoundAdapter();
    const executor = createEffectExecutor({
      store: createEffectOutcomeStore(createInMemoryKeyValueAdapter()),
      adapters: [notificationAdapter, soundAdapter],
    });

    await runWindDownEffectTransition({
      executor,
      commandId: 'wind-down-ws-1-focus-block-0-0',
      payload: { sessionId: 'ws-1', phaseKind: 'focus-block', remainingSeconds: '120' },
      soundEnabled: false,
      outcomeRevision: 1,
    });
    expect(notificationAdapter.delivered).toHaveLength(1);
    expect(soundAdapter.played).toHaveLength(0);

    await runWindDownEffectTransition({
      executor,
      commandId: 'wind-down-ws-1-focus-block-0-1',
      payload: { sessionId: 'ws-1', phaseKind: 'focus-block', remainingSeconds: '120' },
      soundEnabled: true,
      outcomeRevision: 2,
    });
    expect(soundAdapter.played).toHaveLength(1);
  });
});
