import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createFixedClock } from '../clock';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { createWorkRhythmCommandEnvelope } from '../client/inProcessWorkRhythmClient';
import {
  DEFAULT_WORK_SESSION_GOAL_SECONDS,
  focusBoundarySettlementCommandId,
} from '@/modules/work-rhythm';
import { createInMemoryAlarmAdapter } from '../alarms/inMemoryAlarmAdapter';
import { createCoinCommandHandler } from './coinCommandHandler';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import { createWorkHistoryService } from '@/modules/work-history';
import { createEffectExecutor } from '../effects/effectExecutor';
import { createEffectOutcomeStore } from '../effects/effectOutcomeStore';
import { createWorkHistoryEffectAdapter } from '../effects/workHistoryEffectAdapter';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';

describe('workRhythmCommandHandler', () => {
  it('starts a work session, persists durable anchors, and publishes a focus snapshot', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workstyleProfile.command({
      protocolVersion: 1,
      commandId: 'profile-init',
      module: 'workstyle-profile',
      command: {
        kind: 'initialize-from-onboarding',
        energy: 'high',
        cadence: '25/5',
        primaryFriction: 'starting',
      },
    });

    const response = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'high',
      })
    );

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.snapshot.snapshot).toMatchObject({
        phase: 'focus-block',
        originalGoalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'high',
        momentum: 'steady',
        focusBlockStreak: 0,
      });
      expect(response.snapshot.snapshot.phase).toBe('focus-block');
      if (response.snapshot.snapshot.phase === 'focus-block') {
        expect(response.snapshot.snapshot.schedulerReasonCodes).toEqual(
          expect.arrayContaining(['base-cadence', 'energy-high'])
        );
        expect(response.snapshot.snapshot.remainingFocusSeconds).toBeGreaterThan(0);
        expect(response.snapshot.snapshot.remainingWorkSessionSeconds).toBe(
          DEFAULT_WORK_SESSION_GOAL_SECONDS
        );
      }
    }

    const current = root.value.workRhythmHandler.current();
    expect(current.ok).toBe(true);
    if (current.ok) {
      expect(current.value.snapshot.phase).toBe('focus-block');
    }
  });

  it('replays the same response for duplicate command ids', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const envelope = createWorkRhythmCommandEnvelope(
      {
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      },
      { commandId: 'start-1' }
    );
    const first = await root.value.workRhythm.command(envelope);
    const second = await root.value.workRhythm.command(envelope);
    expect(second).toEqual(first);
  });

  it('rejects stale revisions without mutating state', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const stale = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope(
        {
          kind: 'start-work-session',
          goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
          energy: 'steady',
        },
        { expectedRevision: 99 }
      )
    );
    expect(stale).toMatchObject({
      ok: false,
      error: { kind: 'stale-revision', expectedRevision: 99, actualRevision: 0 },
    });
  });

  it('reconstructs the same active focus snapshot after handler recreation', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const firstRoot = await createBackgroundCompositionRoot({ adapter });
    if (!firstRoot.ok) {
      throw new Error('expected root');
    }

    const started = await firstRoot.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 45 * 60,
        energy: 'low',
      })
    );
    if (!started.ok) {
      throw new Error('expected start');
    }

    const secondRoot = await createBackgroundCompositionRoot({ adapter });
    if (!secondRoot.ok) {
      throw new Error('expected second root');
    }
    const reconstructed = secondRoot.value.workRhythmHandler.current();
    expect(reconstructed.ok).toBe(true);
    if (reconstructed.ok) {
      expect(reconstructed.value.revision).toBe(started.revision);
      expect(reconstructed.value.snapshot).toMatchObject({
        phase: 'focus-block',
        originalGoalSeconds: 45 * 60,
        energy: 'low',
      });
    }
  });

  it('settles a due focus boundary into recess-prompt with idempotent coins and history', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const started = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 60 * 60,
        energy: 'steady',
      })
    );
    if (!started.ok || started.snapshot.snapshot.phase !== 'focus-block') {
      throw new Error('expected focus start');
    }

    const persistence = createPersistedApplicationState({ adapter });
    const hydrated = await persistence.initialize();
    if (!hydrated.ok) {
      throw new Error('expected hydration');
    }
    const workRhythmDoc = hydrated.value.documents['work-rhythm'];
    if (workRhythmDoc.value.phase !== 'focus-block') {
      throw new Error('expected focus document');
    }

    const coinHandler = createCoinCommandHandler(persistence, hydrated.value.documents.coin);
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const effectExecutor = createEffectExecutor({
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
    const { createWorkRhythmCommandHandler } = await import('./workRhythmCommandHandler');
    const handler = createWorkRhythmCommandHandler(persistence, workRhythmDoc, {
      clock: createFixedClock(workRhythmDoc.value.focusDeadlineAtEpochMs),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler,
      effectExecutor,
    });

    const commandId = focusBoundarySettlementCommandId(
      workRhythmDoc.value.sessionId,
      workRhythmDoc.value.focusBlockIndex
    );
    const settled = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'settle-focus-boundary' }, { commandId })
    );
    expect(settled.ok).toBe(true);
    if (settled.ok) {
      expect(settled.snapshot.snapshot.phase).toBe('recess-prompt');
    }

    const coin = await coinHandler.current();
    const history = await workHistory.query();
    expect(coin.ok).toBe(true);
    if (coin.ok) {
      expect(coin.value.value.transactions).toHaveLength(1);
    }
    expect(history.ok).toBe(true);
    if (history.ok) {
      expect(history.value).toHaveLength(1);
      expect(history.value[0]?.kind).toBe('focus-block-completed');
    }

    const duplicate = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'settle-focus-boundary' }, { commandId })
    );
    expect(duplicate).toEqual(settled);
    const historyAfter = await workHistory.query();
    if (historyAfter.ok) {
      expect(historyAfter.value).toHaveLength(1);
    }
  });
});

describe('workRhythmCommandHandler clock injection', () => {
  it('projects remaining values from the injected clock rather than domain wall-clock reads', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const nowEpochMs = 1_700_000_000_000;
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const handlerModule = await import('./workRhythmCommandHandler');
    const persistenceModule = await import('@/modules/persisted-application-state');
    const persistence = persistenceModule.createPersistedApplicationState({ adapter });
    const initialized = await persistence.initialize();
    if (!initialized.ok) {
      throw new Error('expected persistence');
    }
    const coinHandler = createCoinCommandHandler(persistence, initialized.value.documents.coin);
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const effectExecutor = createEffectExecutor({
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

    const handler = handlerModule.createWorkRhythmCommandHandler(
      persistence,
      initialized.value.documents['work-rhythm'],
      {
        clock: createFixedClock(nowEpochMs),
        alarms: createInMemoryAlarmAdapter(),
        coinHandler,
        effectExecutor,
        createSessionId: () => 'ws-fixed',
      }
    );

    const response = await handler.execute(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 60 * 60,
        energy: 'steady',
      })
    );
    expect(response.ok).toBe(true);
    if (response.ok && response.snapshot.snapshot.phase === 'focus-block') {
      const later = handlerModule.createWorkRhythmCommandHandler(
        persistence,
        {
          schemaVersion: 1,
          revision: response.revision,
          value: {
            phase: 'focus-block',
            sessionId: 'ws-fixed',
            originalGoalSeconds: 60 * 60,
            sessionStartedAtEpochMs: nowEpochMs,
            remainingWorkSessionSeconds: 60 * 60,
            settledRemainingWorkSessionSeconds: 60 * 60,
            energy: 'steady',
            momentum: 'steady',
            focusBlockIndex: 0,
            focusBlockStartedAtEpochMs: nowEpochMs,
            focusDeadlineAtEpochMs: nowEpochMs + 25 * 60 * 1000,
            focusDurationSeconds: 25 * 60,
            isFinalFocus: false,
            wasExtension: false,
            schedulerReasons: [
              { code: 'base-cadence', focusDeltaMinutes: 25, recessDeltaMinutes: 5 },
            ],
            focusBlockStreak: 0,
          },
        },
        {
          clock: createFixedClock(nowEpochMs + 5 * 60 * 1000),
          alarms: createInMemoryAlarmAdapter(),
          coinHandler,
          effectExecutor,
        }
      );
      const current = later.current();
      if (current.ok && current.value.snapshot.phase === 'focus-block') {
        expect(current.value.snapshot.remainingFocusSeconds).toBe(20 * 60);
        expect(current.value.snapshot.remainingWorkSessionSeconds).toBe(55 * 60);
      }
    }
  });
});
