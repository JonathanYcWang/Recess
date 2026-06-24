import { describe, expect, it } from 'vitest';
import {
  declineRecessCommandId,
  endWorkSessionEarlyCommandId,
  focusBoundarySettlementCommandId,
  resumeFromTimeOutCommandId,
  startTimeOutCommandId,
  startWorkSessionExtensionCommandId,
  windDownBoundaryEpochMs,
  type WorkRhythmFocusBlock,
  type WorkRhythmWorkSessionCompleted,
} from '@/modules/work-rhythm';
import { createWorkRhythmCommandEnvelope } from '@/runtime/client/inProcessWorkRhythmClient';
import { createWorkRhythmVerificationHarness } from './workRhythmVerificationHarness';

const readFocus = async (
  harness: Awaited<ReturnType<typeof createWorkRhythmVerificationHarness>>
): Promise<WorkRhythmFocusBlock> => {
  const current = harness.handler.current();
  if (!current.ok || current.value.snapshot.phase !== 'focus-block') {
    throw new Error('expected focus-block snapshot');
  }
  const persisted = await harness.persistence.initialize();
  if (!persisted.ok || persisted.value.documents['work-rhythm'].value.phase !== 'focus-block') {
    throw new Error('expected focus-block document');
  }
  return persisted.value.documents['work-rhythm'].value;
};

describe('work rhythm verification matrix', () => {
  describe('lifecycle coverage', () => {
    it('traces start, non-final settlement, and recess prompt projection', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      const started = await harness.startSession();
      expect(started.ok).toBe(true);
      if (!started.ok || started.snapshot.snapshot.phase !== 'focus-block') {
        throw new Error('expected focus start');
      }

      const focus = await readFocus(harness);
      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const settled = await harness.handler.reconcileDueBoundaries();
      expect(settled?.ok).toBe(true);
      if (settled?.ok) {
        expect(settled.snapshot.snapshot.phase).toBe('recess-prompt');
      }
    });

    it('traces final focus settlement into work-session-completed', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      const started = await harness.startSession(15 * 60);
      expect(started.ok).toBe(true);
      const focus = await readFocus(harness);
      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const settled = await harness.handler.reconcileDueBoundaries();
      expect(settled?.ok).toBe(true);
      if (settled?.ok) {
        expect(settled.snapshot.snapshot.phase).toBe('work-session-completed');
      }
    });

    it('traces early end from an active focus block', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      await harness.startSession();
      const focus = await readFocus(harness);
      await harness.setNow(focus.focusBlockStartedAtEpochMs + 5 * 60 * 1000);
      const ended = await harness.handler.execute(
        createWorkRhythmCommandEnvelope(
          { kind: 'end-work-session' },
          { commandId: endWorkSessionEarlyCommandId(focus.sessionId) }
        )
      );
      expect(ended.ok).toBe(true);
      if (ended.ok) {
        expect(ended.snapshot.snapshot.phase).toBe('inactive');
      }
    });

    it('traces time out reports, resume, and focus block extension decline', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      await harness.startSession();
      let focus = await readFocus(harness);
      await harness.setNow(focus.focusBlockStartedAtEpochMs + 60_000);
      const timedOut = await harness.handler.execute(
        createWorkRhythmCommandEnvelope(
          { kind: 'start-time-out' },
          { commandId: startTimeOutCommandId(focus.sessionId) }
        )
      );
      expect(timedOut.ok).toBe(true);

      const persisted = await harness.persistence.initialize();
      if (!persisted.ok || persisted.value.documents['work-rhythm'].value.phase !== 'time-out') {
        throw new Error('expected time-out');
      }
      const timeOut = persisted.value.documents['work-rhythm'].value;
      await harness.setNow(timeOut.timeOutStartedAtEpochMs + 10 * 60 * 1000);
      await harness.handler.reconcileTimeOutReports();

      await harness.setNow(timeOut.timeOutStartedAtEpochMs + 11 * 60 * 1000);
      const resumed = await harness.handler.execute(
        createWorkRhythmCommandEnvelope(
          { kind: 'resume-from-time-out' },
          { commandId: resumeFromTimeOutCommandId(focus.sessionId) }
        )
      );
      expect(resumed.ok).toBe(true);

      focus = await readFocus(harness);
      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const settled = await harness.handler.reconcileDueBoundaries();
      expect(settled?.ok).toBe(true);
      if (!settled?.ok || settled.snapshot.snapshot.phase !== 'recess-prompt') {
        throw new Error('expected recess prompt');
      }
      const recessDoc = await harness.persistence.initialize();
      if (
        !recessDoc.ok ||
        recessDoc.value.documents['work-rhythm'].value.phase !== 'recess-prompt'
      ) {
        throw new Error('expected recess prompt document');
      }
      const recess = recessDoc.value.documents['work-rhythm'].value;
      const declined = await harness.handler.execute(
        createWorkRhythmCommandEnvelope(
          { kind: 'decline-recess' },
          {
            commandId: declineRecessCommandId(
              recess.sessionId,
              recess.completedFocusBlockIndex,
              recess.lastSettledSegment + 1
            ),
          }
        )
      );
      expect(declined.ok).toBe(true);
      if (declined.ok) {
        expect(declined.snapshot.snapshot.phase).toBe('focus-block');
      }
    });

    it('traces streak awards, work session extension, and wind-down', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      const focus: WorkRhythmFocusBlock = {
        phase: 'focus-block',
        sessionId: 'ws-verify',
        originalGoalSeconds: 60 * 60,
        sessionStartedAtEpochMs: 1_000_000,
        remainingWorkSessionSeconds: 60 * 60,
        settledRemainingWorkSessionSeconds: 60 * 60,
        energy: 'steady',
        momentum: 'steady',
        focusBlockIndex: 2,
        focusBlockStartedAtEpochMs: 1_000_000,
        focusDeadlineAtEpochMs: 1_000_000 + 25 * 60 * 1000,
        focusDurationSeconds: 25 * 60,
        isFinalFocus: false,
        wasExtension: false,
        schedulerReasons: [{ code: 'base-cadence', focusDeltaMinutes: 25, recessDeltaMinutes: 5 }],
        focusBlockStreak: 2,
        settlementSegment: 0,
        originalGoalPermanentlyComplete: false,
        isWorkSessionExtension: false,
        extensionTrancheSeconds: 0,
        extensionBaselineCumulativeSeconds: 0,
        extensionBaselineCount: 0,
      };
      await harness.persistence.commit([
        {
          document: 'work-rhythm',
          expectedRevision: 0,
          value: focus,
        },
      ]);
      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const handler = await harness.recreateHandler();
      const streakSettled = await handler.execute(
        createWorkRhythmCommandEnvelope(
          { kind: 'settle-focus-boundary' },
          {
            commandId: focusBoundarySettlementCommandId(
              focus.sessionId,
              focus.focusBlockIndex,
              focus.settlementSegment
            ),
          }
        )
      );
      expect(streakSettled.ok).toBe(true);
      const coin = await harness.coinHandler.current();
      if (coin.ok) {
        expect(
          coin.value.value.transactions.some((txn) => txn.reasonCode === 'focus-block-streak')
        ).toBe(true);
      }

      const afterStreak = await harness.persistence.initialize();
      if (!afterStreak.ok) {
        throw new Error('expected persistence after streak');
      }
      const completed: WorkRhythmWorkSessionCompleted = {
        phase: 'work-session-completed',
        sessionId: 'ws-verify',
        originalGoalSeconds: 60 * 60,
        cumulativeExtensionSeconds: 0,
        extensionCount: 0,
        energy: 'steady',
        momentum: 'steady',
        focusBlockStreak: 3,
        lastCompletedFocusBlockIndex: 2,
        originalGoalPermanentlyComplete: true,
        sessionCompletedAtEpochMs: focus.focusDeadlineAtEpochMs,
      };
      await harness.persistence.commit([
        {
          document: 'work-rhythm',
          expectedRevision: afterStreak.value.documents['work-rhythm'].revision,
          value: completed,
        },
      ]);
      const extensionHandler = await harness.recreateHandler();
      const extended = await extensionHandler.execute(
        createWorkRhythmCommandEnvelope(
          { kind: 'start-work-session-extension', extensionSeconds: 30 * 60 },
          { commandId: startWorkSessionExtensionCommandId('ws-verify', 0) }
        )
      );
      expect(extended.ok).toBe(true);

      await harness.recreateHandler();
      const extensionFocus = await readFocus(harness);
      await harness.setNow(windDownBoundaryEpochMs(extensionFocus.focusDeadlineAtEpochMs));
      const windDown = await harness.handler.reconcileWindDownSignals();
      expect(windDown?.ok).toBe(true);
      expect(harness.windDownNotifications.delivered).toHaveLength(1);
    });
  });

  describe('timing, reload, and delayed wake', () => {
    it('settles chronologically from durable anchors after handler reload', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      await harness.startSession();
      const focus = await readFocus(harness);
      await harness.recreateHandler();
      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const settled = await harness.handler.reconcileDueBoundaries();
      expect(settled?.ok).toBe(true);
      if (settled?.ok) {
        expect(settled.snapshot.snapshot.phase).toBe('recess-prompt');
      }
    });

    it('catches up multiple time-out boundaries in one reconcile without wall-clock sleeps', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      await harness.startSession();
      const focus = await readFocus(harness);
      await harness.setNow(focus.focusBlockStartedAtEpochMs + 60_000);
      await harness.handler.execute(
        createWorkRhythmCommandEnvelope(
          { kind: 'start-time-out' },
          { commandId: startTimeOutCommandId(focus.sessionId) }
        )
      );
      const persisted = await harness.persistence.initialize();
      if (!persisted.ok || persisted.value.documents['work-rhythm'].value.phase !== 'time-out') {
        throw new Error('expected time-out');
      }
      const timeOut = persisted.value.documents['work-rhythm'].value;
      await harness.setNow(timeOut.timeOutStartedAtEpochMs + 15 * 60 * 1000);
      const caughtUp = await harness.handler.reconcileTimeOutReports();
      expect(caughtUp?.ok).toBe(true);
      const after = await harness.persistence.initialize();
      if (after.ok && after.value.documents['work-rhythm'].value.phase === 'time-out') {
        expect(after.value.documents['work-rhythm'].value.lastReportedFiveMinuteBoundary).toBe(3);
      }
    });

    it('fires wind-down before settlement when waking between boundaries', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      await harness.startSession();
      const focus = await readFocus(harness);
      await harness.setNow(windDownBoundaryEpochMs(focus.focusDeadlineAtEpochMs));
      const windDown = await harness.handler.reconcileWindDownSignals();
      expect(windDown?.ok).toBe(true);

      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const settled = await harness.handler.reconcileDueBoundaries();
      expect(settled?.ok).toBe(true);
      expect(harness.windDownNotifications.delivered).toHaveLength(1);
    });
  });

  describe('failure and race preservation', () => {
    it('preserves exact-once settlement when history append fails', async () => {
      const harness = await createWorkRhythmVerificationHarness({ historyAppendFails: true });
      await harness.startSession();
      const focus = await readFocus(harness);
      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const settled = await harness.handler.reconcileDueBoundaries();
      expect(settled?.ok).toBe(true);
      const history = await harness.workHistory.query();
      if (history.ok) {
        expect(history.value).toHaveLength(0);
      }
      const commandId = focusBoundarySettlementCommandId(
        focus.sessionId,
        focus.focusBlockIndex,
        focus.settlementSegment
      );
      const duplicate = await harness.handler.execute(
        createWorkRhythmCommandEnvelope({ kind: 'settle-focus-boundary' }, { commandId })
      );
      expect(duplicate).toEqual(settled);
    });

    it('preserves exact-once wind-down when notification delivery fails', async () => {
      const harness = await createWorkRhythmVerificationHarness({ windDownDeliver: false });
      await harness.startSession();
      const focus = await readFocus(harness);
      await harness.setNow(windDownBoundaryEpochMs(focus.focusDeadlineAtEpochMs));
      const first = await harness.handler.reconcileWindDownSignals();
      const second = await harness.handler.reconcileWindDownSignals();
      expect(second).toEqual(first);

      await harness.setNow(focus.focusDeadlineAtEpochMs);
      const settled = await harness.handler.reconcileDueBoundaries();
      expect(settled?.ok).toBe(true);
    });

    it('rejects stale revisions and duplicate command delivery', async () => {
      const harness = await createWorkRhythmVerificationHarness();
      const stale = await harness.handler.execute(
        createWorkRhythmCommandEnvelope(
          {
            kind: 'start-work-session',
            goalSeconds: 60 * 60,
            energy: 'steady',
          },
          { expectedRevision: 99 }
        )
      );
      expect(stale).toMatchObject({
        ok: false,
        error: { kind: 'stale-revision', expectedRevision: 99, actualRevision: 0 },
      });

      const envelope = createWorkRhythmCommandEnvelope(
        {
          kind: 'start-work-session',
          goalSeconds: 60 * 60,
          energy: 'steady',
        },
        { commandId: 'matrix-start-duplicate' }
      );
      const first = await harness.handler.execute(envelope);
      const second = await harness.handler.execute(envelope);
      expect(second).toEqual(first);
    });
  });
});
