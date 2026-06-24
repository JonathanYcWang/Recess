import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import { createWorkHistoryService } from '@/modules/work-history';
import { createFocusBlockCompletedFact } from '@/modules/work-rhythm/focusBlockCompleted';
import { createEffectExecutor } from '@/runtime/effects/effectExecutor';
import { createEffectOutcomeStore } from '@/runtime/effects/effectOutcomeStore';
import { createWorkHistoryEffectAdapter } from '@/runtime/effects/workHistoryEffectAdapter';
import { runWorkHistoryAppendEffectTransition } from '@/runtime/effects/workHistoryEffectTransition';

describe('work history append effect integration', () => {
  it('persists operational commit before history append executes', async () => {
    let persistedBeforeExecute = false;
    const adapter = createInMemoryKeyValueAdapter();
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const store = createEffectOutcomeStore(adapter);
    const executor = createEffectExecutor({
      store,
      adapters: [
        createWorkHistoryEffectAdapter({
          append: async (facts) => {
            const result = await workHistory.append(facts);
            return result.ok ? { ok: true } : { ok: false, error: 'append-failed' };
          },
        }),
      ],
      hooks: {
        beforeExecute: async () => {
          const records = await store.list();
          expect(records).toHaveLength(1);
          expect(records[0]?.phase).toBe('pending-execution');
          persistedBeforeExecute = true;
        },
      },
    });

    const fact = createFocusBlockCompletedFact({
      factId: 'focus-block-1',
      recordedAt: 100,
      workSessionId: 'session-1',
      focusBlockIndex: 0,
      plannedFocusMinutes: 25,
      actualFocusSeconds: 24 * 60,
      completedAt: 1540,
      energyAtStart: 'steady',
      wasExtension: false,
    });

    await runWorkHistoryAppendEffectTransition({
      executor,
      commandId: 'cmd-history-1',
      fact,
      outcomeRevision: 1,
    });

    expect(persistedBeforeExecute).toBe(true);
    const query = await workHistory.query();
    expect(query.ok).toBe(true);
    if (query.ok) {
      expect(query.value).toHaveLength(1);
      expect(query.value[0]?.id).toBe('focus-block-1');
    }
  });

  it('does not duplicate facts when the effect is replayed', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const store = createEffectOutcomeStore(adapter);
    const executor = createEffectExecutor({
      store,
      adapters: [
        createWorkHistoryEffectAdapter({
          append: async (facts) => {
            const result = await workHistory.append(facts);
            return result.ok ? { ok: true } : { ok: false, error: 'append-failed' };
          },
        }),
      ],
    });

    const fact = createFocusBlockCompletedFact({
      factId: 'focus-block-dup',
      recordedAt: 200,
      workSessionId: 'session-1',
      focusBlockIndex: 1,
      plannedFocusMinutes: 20,
      actualFocusSeconds: 20 * 60,
      completedAt: 3200,
      energyAtStart: 'high',
      wasExtension: false,
    });

    await runWorkHistoryAppendEffectTransition({
      executor,
      commandId: 'cmd-history-dup',
      fact,
      outcomeRevision: 2,
    });
    await executor.executeIntent('effect-cmd-history-dup');

    const query = await workHistory.query();
    expect(query.ok).toBe(true);
    if (query.ok) {
      expect(query.value).toHaveLength(1);
    }
  });

  it('reconstructs pending history append after worker restart', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const store = createEffectOutcomeStore(adapter);
    const failingExecutor = createEffectExecutor({
      store,
      adapters: [
        createWorkHistoryEffectAdapter({
          append: async () => ({ ok: false, error: 'indexeddb-unavailable' }),
        }),
      ],
    });

    const fact = createFocusBlockCompletedFact({
      factId: 'focus-block-retry',
      recordedAt: 300,
      workSessionId: 'session-2',
      focusBlockIndex: 0,
      plannedFocusMinutes: 15,
      actualFocusSeconds: 15 * 60,
      completedAt: 900,
      energyAtStart: 'low',
      wasExtension: false,
    });

    await runWorkHistoryAppendEffectTransition({
      executor: failingExecutor,
      commandId: 'cmd-history-retry',
      fact,
      outcomeRevision: 3,
    });

    const retryExecutor = createEffectExecutor({
      store: createEffectOutcomeStore(adapter),
      adapters: [
        createWorkHistoryEffectAdapter({
          append: async (facts) => {
            const result = await workHistory.append(facts);
            return result.ok ? { ok: true } : { ok: false, error: 'append-failed' };
          },
        }),
      ],
    });

    const rolled = await retryExecutor.rollForwardPending();
    expect(rolled).toHaveLength(1);
    expect(rolled[0]?.phase).toBe('completed');

    const query = await workHistory.query();
    expect(query.ok).toBe(true);
    if (query.ok) {
      expect(query.value.map((entry) => entry.id)).toEqual(['focus-block-retry']);
    }
  });
});
