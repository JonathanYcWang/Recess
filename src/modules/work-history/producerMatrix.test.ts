import { describe, expect, it } from 'vitest';
import { createWorkHistoryEffectAdapter } from '@/runtime/effects/workHistoryEffectAdapter';
import {
  effectFactsToWorkHistoryFact,
  WORK_HISTORY_FACT_KINDS,
  workHistoryFactToEffectFacts,
} from './factCodec';
import {
  assertProducerMatrixCoversDeclaredKinds,
  implementedProducerEntries,
  WORK_HISTORY_PRODUCER_MATRIX,
} from './producerMatrix';
import { createFocusBlockCompletedFact } from '@/modules/work-rhythm/focusBlockCompleted';
import { createRecessCompletedFact } from '@/modules/work-rhythm/recessCompleted';
import { createRecessStartedFact } from '@/modules/work-rhythm/recessStarted';
import { createTaskFocusedTimeAttributedFact } from '@/modules/work-rhythm/taskFocusedTimeAttributed';
import { createTimeOutEndedFact } from '@/modules/work-rhythm/timeOutEnded';
import { createTimeOutStartedFact } from '@/modules/work-rhythm/timeOutStarted';
import { createWorkSessionCompletedFact } from '@/modules/work-rhythm/workSessionCompleted';
import { createWorkSessionExtendedFact } from '@/modules/work-rhythm/workSessionExtended';
import { createWorkSessionStartedFact } from '@/modules/work-rhythm/workSessionStarted';
import { createTaskCompletedFact } from '@/modules/task-list/taskCompleted';
import { createReminderOccurrenceResolvedFact } from '@/modules/work-start-reminder/reminderOccurrenceResolved';

describe('work history producer matrix', () => {
  it('covers every declared fact kind', () => {
    expect(() => assertProducerMatrixCoversDeclaredKinds()).not.toThrow();
    expect(WORK_HISTORY_FACT_KINDS).toHaveLength(coveredFactKinds().length);
  });

  it('lists implemented producers for every lifecycle family', () => {
    const implemented = implementedProducerEntries();
    expect(implemented.length).toBeGreaterThan(10);
    expect(WORK_HISTORY_PRODUCER_MATRIX.some((entry) => entry.status === 'excluded')).toBe(true);
  });

  it('round-trips every implemented fact through the versioned codec', () => {
    const samples = [
      createWorkSessionStartedFact({
        factId: 'work-session-started-s1',
        recordedAt: 1,
        workSessionId: 's1',
        startedAtEpochMs: 1,
        goalSeconds: 3600,
        energy: 'steady',
      }),
      createWorkSessionCompletedFact({
        factId: 'work-session-completed-s1',
        recordedAt: 2,
        workSessionId: 's1',
        originalGoalSeconds: 3600,
        actualWorkedSeconds: 3000,
        completedAt: 2,
        originalGoalPermanentlyComplete: true,
      }),
      createWorkSessionExtendedFact({
        factId: 'work-session-extended-s1-0',
        recordedAt: 3,
        workSessionId: 's1',
        extensionOrdinal: 0,
        extensionSeconds: 900,
        extendedAtEpochMs: 3,
      }),
      createFocusBlockCompletedFact({
        factId: 'focus-block-s1-0-0',
        recordedAt: 4,
        workSessionId: 's1',
        focusBlockIndex: 0,
        plannedFocusMinutes: 25,
        actualFocusSeconds: 1500,
        completedAt: 4,
        energyAtStart: 'steady',
        wasExtension: false,
      }),
      createRecessStartedFact({
        factId: 'recess-started-s1-0',
        recordedAt: 5,
        workSessionId: 's1',
        focusBlockIndex: 0,
        startedAtEpochMs: 5,
        plannedRecessSeconds: 300,
      }),
      createRecessCompletedFact({
        factId: 'recess-completed-s1-0-natural',
        recordedAt: 6,
        workSessionId: 's1',
        focusBlockIndex: 0,
        startedAtEpochMs: 5,
        endedAtEpochMs: 6,
        actualRecessSeconds: 300,
        endedEarly: false,
      }),
      createTimeOutStartedFact({
        factId: 'time-out-started-s1-0',
        recordedAt: 7,
        workSessionId: 's1',
        focusBlockIndex: 0,
        startedAtEpochMs: 7,
        focusSecondsBeforeTimeOut: 600,
      }),
      createTimeOutEndedFact({
        factId: 'time-out-ended-s1-0-7',
        recordedAt: 8,
        workSessionId: 's1',
        focusBlockIndex: 0,
        startedAtEpochMs: 7,
        endedAtEpochMs: 8,
        durationSeconds: 120,
      }),
      createTaskFocusedTimeAttributedFact({
        factId: 'task-focused-time-s1-t1-1-2',
        recordedAt: 9,
        workSessionId: 's1',
        taskId: 't1',
        seconds: 60,
        attributedAt: 9,
        focusBlockIndex: 0,
        intervalStartedAt: 1,
        intervalEndedAt: 2,
      }),
      createTaskCompletedFact({
        factId: 'task-completed-t1',
        recordedAt: 10,
        taskId: 't1',
        workSessionId: 's1',
        originalEstimateMinutes: 30,
        totalFocusedTimeSeconds: 1800,
        completedAtEpochMs: 10,
      }),
      createReminderOccurrenceResolvedFact({
        factId: 'reminder-occurrence-o1',
        recordedAt: 11,
        logicalOutcomeId: 'o1',
        occurrenceIds: ['occ-1'],
        outcome: 'satisfied',
        resolvedAtEpochMs: 11,
        workSessionId: 's1',
      }),
    ];

    for (const fact of samples) {
      const roundTripped = effectFactsToWorkHistoryFact(workHistoryFactToEffectFacts(fact));
      expect(roundTripped).toEqual(fact);
    }
  });

  it('rejects unsupported kinds in the effect adapter', async () => {
    const adapter = createWorkHistoryEffectAdapter({
      append: async () => ({ ok: true }),
    });
    const result = await adapter.execute({
      intentId: 'intent-1',
      commandId: 'cmd-1',
      module: 'work-history',
      kind: 'work-history.append',
      facts: {
        factId: 'bad',
        recordedAt: '1',
        kind: 'unsupported-kind',
      },
    });
    expect(result.ok).toBe(false);
  });
});

const coveredFactKinds = () => [
  ...new Set(
    WORK_HISTORY_PRODUCER_MATRIX.filter((entry) => entry.factKind !== null).map(
      (entry) => entry.factKind!
    )
  ),
];
