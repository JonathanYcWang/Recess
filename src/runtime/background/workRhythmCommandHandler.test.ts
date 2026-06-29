import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createFixedClock } from '../clock';
import { createBackgroundCompositionRoot } from '../background/backgroundCompositionRoot';
import { createWorkRhythmCommandEnvelope } from '../client/inProcessWorkRhythmClient';
import {
  DEFAULT_WORK_SESSION_GOAL_SECONDS,
  endWorkSessionEarlyCommandId,
  focusBoundarySettlementCommandId,
  declineRecessCommandId,
  resumeFromTimeOutCommandId,
  startTimeOutCommandId,
  startWorkSessionExtensionCommandId,
  windDownBoundaryEpochMs,
  workRhythmWindDownAlarmName,
} from '@/modules/work-rhythm';
import { createInMemoryWindDownNotificationAdapter } from '../windDown/windDownNotificationAdapter';
import { createInMemoryWindDownSoundAdapter } from '../windDown/windDownSoundAdapter';
import { createNoOpTimeOutReportNotifier } from '../timeOut/timeOutReportNotifier';
import { createInMemoryAlarmAdapter } from '../alarms/inMemoryAlarmAdapter';
import { createCoinCommandHandler } from './coinCommandHandler';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import { createWorkHistoryService } from '@/modules/work-history';
import { createEffectExecutor } from '../effects/effectExecutor';
import { createEffectOutcomeStore } from '../effects/effectOutcomeStore';
import { createWorkHistoryEffectAdapter } from '../effects/workHistoryEffectAdapter';
import { createPersistedApplicationState } from '@/runtime/persistence';
import { createWorkRhythmHandlerForTests } from './workRhythmCommandHandlerTestUtils';

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
    const handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(workRhythmDoc.value.focusDeadlineAtEpochMs),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler,
      effectExecutor,
    });

    const commandId = focusBoundarySettlementCommandId(
      workRhythmDoc.value.sessionId,
      workRhythmDoc.value.focusBlockIndex,
      workRhythmDoc.value.settlementSegment
    );
    const settled = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'settle-focus-boundary' }, { commandId })
    );
    expect(settled.ok).toBe(true);
    if (settled.ok) {
      expect(settled.snapshot.snapshot.phase).toBe('recess-prompt');
      if (settled.snapshot.snapshot.phase === 'recess-prompt') {
        expect(settled.snapshot.snapshot.focusBlockStreak).toBe(1);
        expect(settled.snapshot.snapshot.blocksUntilNextStreakMilestone).toBe(2);
      }
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

  it('ends an active focus block early with partial settlement and idempotent effects', async () => {
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

    const partialNow = workRhythmDoc.value.focusBlockStartedAtEpochMs + 10 * 60 * 1000;
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
    const handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(partialNow),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler,
      effectExecutor,
    });

    const commandId = endWorkSessionEarlyCommandId(workRhythmDoc.value.sessionId);
    const ended = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'end-work-session' }, { commandId })
    );
    expect(ended.ok).toBe(true);
    if (ended.ok) {
      expect(ended.snapshot.snapshot.phase).toBe('inactive');
    }

    const coin = await coinHandler.current();
    const history = await workHistory.query();
    expect(coin.ok).toBe(true);
    if (coin.ok) {
      expect(coin.value.value.transactions).toHaveLength(1);
      expect(coin.value.value.transactions[0]?.amount).toBe(10);
    }
    expect(history.ok).toBe(true);
    if (history.ok) {
      expect(history.value).toHaveLength(2);
      expect(history.value.map((fact) => fact.kind)).toEqual([
        'focus-block-completed',
        'work-session-completed',
      ]);
      expect(history.value[0]?.payload.completed).toBe(false);
      expect(history.value[1]?.payload.originalGoalPermanentlyComplete).toBe(false);
    }

    const duplicate = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'end-work-session' }, { commandId })
    );
    expect(duplicate).toEqual(ended);
    const historyAfter = await workHistory.query();
    if (historyAfter.ok) {
      expect(historyAfter.value).toHaveLength(2);
    }
  });

  it('rejects end-work-session when inactive', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const ended = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope(
        { kind: 'end-work-session' },
        { commandId: 'end-work-session-ws-missing' }
      )
    );
    expect(ended).toMatchObject({ ok: false, error: { kind: 'no-active-work-session' } });
  });

  it('starts and resumes time out without consuming settled remaining values', async () => {
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

    const partialNow = workRhythmDoc.value.focusBlockStartedAtEpochMs + 10 * 60 * 1000;
    const reports: Array<{ elapsedMinutes: number }> = [];
    const handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(partialNow),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler: createCoinCommandHandler(persistence, hydrated.value.documents.coin),
      timeOutReportNotifier: {
        notify: async (payload) => {
          reports.push({ elapsedMinutes: payload.elapsedMinutes });
        },
      },
    });

    const startCommandId = startTimeOutCommandId(workRhythmDoc.value.sessionId);
    const timedOut = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'start-time-out' }, { commandId: startCommandId })
    );
    expect(timedOut.ok).toBe(true);
    if (timedOut.ok) {
      expect(timedOut.snapshot.snapshot.phase).toBe('time-out');
      if (timedOut.snapshot.snapshot.phase === 'time-out') {
        expect(timedOut.snapshot.snapshot.remainingFocusSeconds).toBe(15 * 60);
        expect(timedOut.snapshot.snapshot.remainingWorkSessionSeconds).toBe(50 * 60);
      }
    }

    const duplicateStart = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'start-time-out' }, { commandId: startCommandId })
    );
    expect(duplicateStart).toEqual(timedOut);

    const rehydrated = await persistence.initialize();
    if (!rehydrated.ok) {
      throw new Error('expected rehydrate');
    }
    const timeOutDoc = rehydrated.value.documents['work-rhythm'];

    const resumeAt = partialNow + 2 * 60 * 1000;
    const resumedHandler = await createWorkRhythmHandlerForTests(persistence, timeOutDoc, {
      clock: createFixedClock(resumeAt),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler: createCoinCommandHandler(persistence, hydrated.value.documents.coin),
      timeOutReportNotifier: createNoOpTimeOutReportNotifier(),
    });
    const resumeCommandId = resumeFromTimeOutCommandId(workRhythmDoc.value.sessionId);
    const resumed = await resumedHandler.execute(
      createWorkRhythmCommandEnvelope(
        { kind: 'resume-from-time-out' },
        { commandId: resumeCommandId }
      )
    );
    expect(resumed.ok).toBe(true);
    if (resumed.ok && resumed.snapshot.snapshot.phase === 'focus-block') {
      expect(resumed.snapshot.snapshot.remainingFocusSeconds).toBe(15 * 60);
      expect(resumed.snapshot.snapshot.remainingWorkSessionSeconds).toBe(50 * 60);
    }
  });

  it('reconciles five- and ten-minute time out reports with momentum lowering', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const started = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: 60 * 60,
        energy: 'high',
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
    let workRhythmDoc = hydrated.value.documents['work-rhythm'];
    if (workRhythmDoc.value.phase !== 'focus-block') {
      throw new Error('expected focus document');
    }

    const timeOutStart = workRhythmDoc.value.focusBlockStartedAtEpochMs + 60_000;
    const reports: number[] = [];
    let handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(timeOutStart),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler: createCoinCommandHandler(persistence, hydrated.value.documents.coin),
      timeOutReportNotifier: {
        notify: async (payload) => {
          reports.push(payload.elapsedMinutes);
        },
      },
    });

    const startCommandId = startTimeOutCommandId(workRhythmDoc.value.sessionId);
    const timedOut = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'start-time-out' }, { commandId: startCommandId })
    );
    if (!timedOut.ok) {
      throw new Error('expected time out');
    }

    const rehydrated = await persistence.initialize();
    if (!rehydrated.ok) {
      throw new Error('expected rehydrate');
    }
    workRhythmDoc = rehydrated.value.documents['work-rhythm'];
    if (workRhythmDoc.value.phase !== 'time-out') {
      throw new Error('expected time out document');
    }

    const atTenMinutes = workRhythmDoc.value.timeOutStartedAtEpochMs + 10 * 60 * 1000;
    handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(atTenMinutes),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler: createCoinCommandHandler(persistence, hydrated.value.documents.coin),
      timeOutReportNotifier: {
        notify: async (payload) => {
          reports.push(payload.elapsedMinutes);
        },
      },
    });

    await handler.reconcileTimeOutReports();
    expect(reports).toEqual([5, 10]);
    const current = handler.current();
    if (current.ok && current.value.snapshot.phase === 'time-out') {
      expect(current.value.snapshot.momentum).toBe('low');
    }

    await handler.reconcileTimeOutReports();
    expect(reports).toEqual([5, 10]);
  });

  it('awards focus block streak coins idempotently at the third completed block', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    const hydrated = await persistence.initialize();
    if (!hydrated.ok) {
      throw new Error('expected hydration');
    }

    const coinHandler = createCoinCommandHandler(persistence, hydrated.value.documents.coin);
    const focus = {
      phase: 'focus-block' as const,
      sessionId: 'ws-streak',
      originalGoalSeconds: 60 * 60,
      sessionStartedAtEpochMs: 1_000_000,
      remainingWorkSessionSeconds: 60 * 60,
      settledRemainingWorkSessionSeconds: 60 * 60,
      energy: 'steady' as const,
      momentum: 'steady' as const,
      focusBlockIndex: 2,
      focusBlockStartedAtEpochMs: 1_000_000,
      focusDeadlineAtEpochMs: 1_000_000 + 25 * 60 * 1000,
      focusDurationSeconds: 25 * 60,
      isFinalFocus: false,
      wasExtension: false,
      schedulerReasons: [
        { code: 'base-cadence' as const, focusDeltaMinutes: 25, recessDeltaMinutes: 5 },
      ],
      focusBlockStreak: 2,
      settlementSegment: 0,
      originalGoalPermanentlyComplete: false,
      isWorkSessionExtension: false,
      extensionTrancheSeconds: 0,
      extensionBaselineCumulativeSeconds: 0,
      extensionBaselineCount: 0,
      selectedTaskIds: [],
      activeTaskId: null,
      activeTaskIntervalStartedAtEpochMs: null,
    };

    const handler = await createWorkRhythmHandlerForTests(
      persistence,
      {
        schemaVersion: 1,
        revision: 0,
        value: focus,
      },
      {
        clock: createFixedClock(focus.focusDeadlineAtEpochMs),
        alarms: createInMemoryAlarmAdapter(),
        coinHandler,
      }
    );

    const commandId = focusBoundarySettlementCommandId(
      focus.sessionId,
      focus.focusBlockIndex,
      focus.settlementSegment
    );
    const settled = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'settle-focus-boundary' }, { commandId })
    );
    expect(settled.ok).toBe(true);

    const coin = await coinHandler.current();
    expect(coin.ok).toBe(true);
    if (coin.ok) {
      expect(coin.value.value.transactions).toHaveLength(2);
      expect(coin.value.value.transactions.map((txn) => txn.reasonCode)).toEqual([
        'standard-focus',
        'focus-block-streak',
      ]);
      expect(coin.value.value.balance).toBe(35);
    }

    const duplicate = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'settle-focus-boundary' }, { commandId })
    );
    expect(duplicate).toEqual(settled);
    const coinAfter = await coinHandler.current();
    if (coinAfter.ok) {
      expect(coinAfter.value.value.transactions).toHaveLength(2);
      expect(coinAfter.value.value.balance).toBe(35);
    }
  });

  it('declines recess into an extension focus block with idempotent command replay', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    const hydrated = await persistence.initialize();
    if (!hydrated.ok) {
      throw new Error('expected hydration');
    }

    const recess: import('@/modules/work-rhythm').WorkRhythmRecessPrompt = {
      phase: 'recess-prompt',
      sessionId: 'ws-decline',
      originalGoalSeconds: 60 * 60,
      sessionStartedAtEpochMs: 1_000_000,
      settledRemainingWorkSessionSeconds: 35 * 60,
      energy: 'steady',
      momentum: 'steady',
      focusBlockStreak: 1,
      completedFocusBlockIndex: 0,
      lastSettledSegment: 0,
      deferredRecessCount: 1,
      originalGoalPermanentlyComplete: false,
      isWorkSessionExtension: false,
      extensionTrancheSeconds: 0,
      extensionBaselineCumulativeSeconds: 0,
      extensionBaselineCount: 0,
    };

    await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: hydrated.value.documents['work-rhythm'].revision,
        value: recess,
      },
    ]);
    const refreshed = await persistence.initialize();
    if (!refreshed.ok) {
      throw new Error('expected refresh');
    }
    const workRhythmDoc = refreshed.value.documents['work-rhythm'];
    if (workRhythmDoc.value.phase !== 'recess-prompt') {
      throw new Error('expected recess prompt');
    }

    const profile = refreshed.value.documents['workstyle-profile'];
    await persistence.commit([
      {
        document: 'workstyle-profile',
        expectedRevision: profile.revision,
        value: {
          ...profile.value,
          preferredCadence: '25/5',
        },
      },
    ]);

    const handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(1_100_000),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler: createCoinCommandHandler(persistence, refreshed.value.documents.coin),
    });

    const commandId = declineRecessCommandId(
      workRhythmDoc.value.sessionId,
      workRhythmDoc.value.completedFocusBlockIndex,
      workRhythmDoc.value.lastSettledSegment + 1
    );
    const declined = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'decline-recess' }, { commandId })
    );
    expect(declined.ok).toBe(true);
    if (declined.ok && declined.snapshot.snapshot.phase === 'focus-block') {
      expect(declined.snapshot.snapshot).toMatchObject({
        phase: 'focus-block',
        focusBlockStreak: 1,
      });
    }

    const duplicate = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'decline-recess' }, { commandId })
    );
    expect(duplicate).toEqual(declined);
  });

  it('starts a work session extension from work-session-completed and schedules focus alarm', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    const hydrated = await persistence.initialize();
    if (!hydrated.ok) {
      throw new Error('expected hydration');
    }

    const completed: import('@/modules/work-rhythm').WorkRhythmWorkSessionCompleted = {
      phase: 'work-session-completed',
      sessionId: 'ws-ext',
      originalGoalSeconds: 60 * 60,
      cumulativeExtensionSeconds: 0,
      extensionCount: 0,
      energy: 'steady',
      momentum: 'steady',
      focusBlockStreak: 2,
      lastCompletedFocusBlockIndex: 1,
      originalGoalPermanentlyComplete: true,
      sessionCompletedAtEpochMs: 4_000_000,
    };

    await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: hydrated.value.documents['work-rhythm'].revision,
        value: completed,
      },
    ]);
    const refreshed = await persistence.initialize();
    if (!refreshed.ok) {
      throw new Error('expected refresh');
    }
    const workRhythmDoc = refreshed.value.documents['work-rhythm'];
    if (workRhythmDoc.value.phase !== 'work-session-completed') {
      throw new Error('expected work session completed');
    }

    const profile = refreshed.value.documents['workstyle-profile'];
    await persistence.commit([
      {
        document: 'workstyle-profile',
        expectedRevision: profile.revision,
        value: {
          ...profile.value,
          preferredCadence: '25/5',
        },
      },
    ]);

    const alarms = createInMemoryAlarmAdapter();
    const handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(5_000_000),
      alarms,
      coinHandler: createCoinCommandHandler(persistence, refreshed.value.documents.coin),
    });

    const commandId = startWorkSessionExtensionCommandId('ws-ext', 0);
    const extended = await handler.execute(
      createWorkRhythmCommandEnvelope(
        { kind: 'start-work-session-extension', extensionSeconds: 30 * 60 },
        { commandId }
      )
    );
    expect(extended.ok).toBe(true);
    if (extended.ok && extended.snapshot.snapshot.phase === 'focus-block') {
      expect(extended.snapshot.snapshot).toMatchObject({
        phase: 'focus-block',
        sessionId: 'ws-ext',
        originalGoalSeconds: 60 * 60,
        remainingWorkSessionSeconds: 30 * 60,
      });
      const scheduled = alarms.getScheduled();
      expect(scheduled).toHaveLength(2);
      const focusAlarm = scheduled.find((alarm) => alarm.name.includes('work-rhythm-focus-'));
      expect(focusAlarm?.whenEpochMs).toBe(
        5_000_000 + extended.snapshot.snapshot.remainingFocusSeconds * 1000
      );
    }

    const duplicate = await handler.execute(
      createWorkRhythmCommandEnvelope(
        { kind: 'start-work-session-extension', extensionSeconds: 30 * 60 },
        { commandId }
      )
    );
    expect(duplicate).toEqual(extended);
  });

  it('reconciles wind-down once at the durable boundary and still settles focus on time', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    const started = await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
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

    const notificationAdapter = createInMemoryWindDownNotificationAdapter({ deliver: false });
    const soundAdapter = createInMemoryWindDownSoundAdapter();
    const effectExecutor = createEffectExecutor({
      store: createEffectOutcomeStore(adapter),
      adapters: [notificationAdapter, soundAdapter],
    });
    const coinHandler = createCoinCommandHandler(persistence, hydrated.value.documents.coin);

    const windDownAt = windDownBoundaryEpochMs(workRhythmDoc.value.focusDeadlineAtEpochMs);
    let handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(windDownAt),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler,
      effectExecutor,
      timeOutReportNotifier: createNoOpTimeOutReportNotifier(),
    });

    const windDown = await handler.reconcileWindDownSignals();
    expect(windDown?.ok).toBe(true);
    const duplicateWindDown = await handler.reconcileWindDownSignals();
    expect(duplicateWindDown).toEqual(windDown);

    handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(workRhythmDoc.value.focusDeadlineAtEpochMs),
      alarms: createInMemoryAlarmAdapter(),
      coinHandler,
      effectExecutor,
      timeOutReportNotifier: createNoOpTimeOutReportNotifier(),
    });
    const settlementId = focusBoundarySettlementCommandId(
      workRhythmDoc.value.sessionId,
      workRhythmDoc.value.focusBlockIndex,
      workRhythmDoc.value.settlementSegment
    );
    const settled = await handler.execute(
      createWorkRhythmCommandEnvelope(
        { kind: 'settle-focus-boundary' },
        { commandId: settlementId }
      )
    );
    expect(settled.ok).toBe(true);
    if (settled.ok) {
      expect(settled.snapshot.snapshot.phase).toBe('recess-prompt');
    }
  });

  it('schedules a wind-down alarm only for eligible focus blocks', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    const hydrated = await persistence.initialize();
    if (!hydrated.ok) {
      throw new Error('expected hydration');
    }

    const alarms = createInMemoryAlarmAdapter();
    const coinHandler = createCoinCommandHandler(persistence, hydrated.value.documents.coin);
    const handler = await createWorkRhythmHandlerForTests(
      persistence,
      hydrated.value.documents['work-rhythm'],
      {
        clock: createFixedClock(1_000_000),
        alarms,
        coinHandler,
        createSessionId: () => 'ws-wind-down',
      }
    );

    const started = await handler.execute(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      })
    );
    expect(started.ok).toBe(true);

    const scheduled = alarms.getScheduled();
    expect(
      scheduled.some((alarm) => alarm.name === workRhythmWindDownAlarmName('ws-wind-down'))
    ).toBe(true);
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

    const persistenceModule = await import('@/runtime/persistence');
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

    const handler = await createWorkRhythmHandlerForTests(
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
      const later = await createWorkRhythmHandlerForTests(
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
            settlementSegment: 0,
            originalGoalPermanentlyComplete: false,
            isWorkSessionExtension: false,
            extensionTrancheSeconds: 0,
            extensionBaselineCumulativeSeconds: 0,
            extensionBaselineCount: 0,
            selectedTaskIds: [],
            activeTaskId: null,
            activeTaskIntervalStartedAtEpochMs: null,
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

describe('workRhythmCommandHandler task attribution', () => {
  it('attributes focused seconds when switching active tasks', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      })
    );

    const created = await root.value.taskList.createTask({
      title: 'Plan',
      originalEstimateMinutes: 30,
    });
    if (!created.ok) {
      throw new Error('expected task');
    }
    const firstId = created.snapshot.snapshot.incompleteTasks[0]?.id;
    if (!firstId) {
      throw new Error('expected first task');
    }

    const second = await root.value.taskList.createTask({
      title: 'Build',
      originalEstimateMinutes: 45,
    });
    if (!second.ok) {
      throw new Error('expected second task');
    }
    const secondId = second.snapshot.snapshot.incompleteTasks.find(
      (task) => task.id !== firstId
    )?.id;
    if (!secondId) {
      throw new Error('expected second task id');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'select-tasks', taskIds: [firstId, secondId] })
    );
    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'set-active-task', taskId: firstId })
    );

    const persistence = createPersistedApplicationState({ adapter });
    const hydrated = await persistence.initialize();
    if (!hydrated.ok) {
      throw new Error('expected hydration');
    }
    const workRhythmDoc = hydrated.value.documents['work-rhythm'];
    if (workRhythmDoc.value.phase !== 'focus-block') {
      throw new Error('expected focus');
    }

    const handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(workRhythmDoc.value.activeTaskIntervalStartedAtEpochMs! + 30_000),
      alarms: createInMemoryAlarmAdapter(),
    });

    const switched = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'set-active-task', taskId: secondId })
    );
    expect(switched.ok).toBe(true);

    const reloaded = await persistence.initialize();
    if (!reloaded.ok) {
      throw new Error('expected reload');
    }
    const firstTask = reloaded.value.documents['task-list'].value.tasks.find(
      (task) => task.id === firstId
    );
    expect(firstTask?.focusedTimeSeconds).toBe(30);
  });

  it('replays duplicate select-tasks command ids', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      })
    );

    const envelope = createWorkRhythmCommandEnvelope(
      { kind: 'select-tasks', taskIds: [] },
      { commandId: 'select-empty' }
    );
    const first = await root.value.workRhythm.command(envelope);
    const second = await root.value.workRhythm.command(envelope);
    expect(second).toEqual(first);
  });

  it('completes the active task and advances to the next selected task', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      })
    );

    const first = await root.value.taskList.createTask({
      title: 'Plan',
      originalEstimateMinutes: 30,
    });
    const second = await root.value.taskList.createTask({
      title: 'Build',
      originalEstimateMinutes: 45,
    });
    if (!first.ok || !second.ok) {
      throw new Error('expected tasks');
    }
    const firstId = first.snapshot.snapshot.incompleteTasks[0]?.id;
    const secondId = second.snapshot.snapshot.incompleteTasks.find(
      (task) => task.id !== firstId
    )?.id;
    if (!firstId || !secondId) {
      throw new Error('expected task ids');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'select-tasks', taskIds: [firstId, secondId] })
    );
    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'set-active-task', taskId: firstId })
    );

    const persistence = createPersistedApplicationState({ adapter });
    const hydrated = await persistence.initialize();
    if (!hydrated.ok) {
      throw new Error('expected hydration');
    }
    const workRhythmDoc = hydrated.value.documents['work-rhythm'];
    if (workRhythmDoc.value.phase !== 'focus-block') {
      throw new Error('expected focus');
    }

    const handler = await createWorkRhythmHandlerForTests(persistence, workRhythmDoc, {
      clock: createFixedClock(workRhythmDoc.value.activeTaskIntervalStartedAtEpochMs! + 45_000),
      alarms: createInMemoryAlarmAdapter(),
    });

    const completed = await handler.execute(
      createWorkRhythmCommandEnvelope({ kind: 'complete-task', taskId: firstId })
    );
    expect(completed.ok).toBe(true);
    if (completed.ok && completed.snapshot.snapshot.phase === 'focus-block') {
      expect(completed.snapshot.snapshot.selectedTaskIds).toEqual([secondId]);
      expect(completed.snapshot.snapshot.activeTaskId).toBe(secondId);
    }

    const reloaded = await persistence.initialize();
    if (!reloaded.ok) {
      throw new Error('expected reload');
    }
    const firstTask = reloaded.value.documents['task-list'].value.tasks.find(
      (task) => task.id === firstId
    );
    const secondTask = reloaded.value.documents['task-list'].value.tasks.find(
      (task) => task.id === secondId
    );
    expect(firstTask?.status).toBe('completed');
    expect(firstTask?.focusedTimeSeconds).toBe(45);
    expect(secondTask?.status).toBe('in-progress');
  });

  it('replays duplicate complete-task command ids', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected root');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({
        kind: 'start-work-session',
        goalSeconds: DEFAULT_WORK_SESSION_GOAL_SECONDS,
        energy: 'steady',
      })
    );

    const created = await root.value.taskList.createTask({
      title: 'Ship',
      originalEstimateMinutes: 30,
    });
    if (!created.ok) {
      throw new Error('expected task');
    }
    const taskId = created.snapshot.snapshot.incompleteTasks[0]?.id;
    if (!taskId) {
      throw new Error('expected task id');
    }

    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'select-tasks', taskIds: [taskId] })
    );
    await root.value.workRhythm.command(
      createWorkRhythmCommandEnvelope({ kind: 'set-active-task', taskId })
    );

    const envelope = createWorkRhythmCommandEnvelope(
      { kind: 'complete-task', taskId },
      { commandId: 'complete-task-once' }
    );
    const first = await root.value.workRhythm.command(envelope);
    const second = await root.value.workRhythm.command(envelope);
    expect(second).toEqual(first);
  });
});
