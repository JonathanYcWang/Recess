import { describe, expect, it } from 'vitest';
import { createTaskCompletedFact } from '@/modules/task-list/taskCompleted';
import { createWorkSessionCompletedFact } from '@/modules/work-rhythm/workSessionCompleted';
import { createReminderOccurrenceResolvedFact } from '@/modules/work-start-reminder/reminderOccurrenceResolved';
import { createTaskFocusedTimeAttributedFact } from '@/modules/work-rhythm/taskFocusedTimeAttributed';
import type { WorkHistoryFact } from '@/modules/work-history';
import {
  selectFactsForWorkSessions,
  selectReminderOccurrenceFacts,
  selectResolvedWorkSessionIds,
  selectTaskCompletionFactsInWindow,
  totalFocusedTimeSecondsForTask,
} from '@/modules/insights';

const sessionCompleted = (
  sessionId: string,
  completedAt: number,
  permanent = true
): WorkHistoryFact =>
  createWorkSessionCompletedFact({
    factId: `work-session-completed-${sessionId}`,
    recordedAt: completedAt,
    workSessionId: sessionId,
    originalGoalSeconds: 3600,
    actualWorkedSeconds: 3000,
    completedAt,
    originalGoalPermanentlyComplete: permanent,
  });

describe('insight query windows', () => {
  it('orders resolved sessions by completion time with id tie-break', () => {
    const facts = [
      sessionCompleted('s2', 20),
      sessionCompleted('s1', 10),
      sessionCompleted('s3', 20),
    ];
    expect(selectResolvedWorkSessionIds(facts, 'all-time')).toEqual(['s1', 's2', 's3']);
    expect(selectResolvedWorkSessionIds(facts, 'recent-5')).toEqual(['s1', 's2', 's3']);
    expect(selectResolvedWorkSessionIds(facts, 'recent-5').slice(-2)).toEqual(['s2', 's3']);
  });

  it('limits session windows to the latest resolved sessions', () => {
    const facts = Array.from({ length: 6 }, (_, index) => sessionCompleted(`s${index}`, index + 1));
    expect(selectResolvedWorkSessionIds(facts, 'recent-5')).toEqual(['s1', 's2', 's3', 's4', 's5']);
  });

  it('includes facts associated with selected session identities', () => {
    const facts = [
      sessionCompleted('s1', 1),
      createTaskCompletedFact({
        factId: 'task-completed-t1',
        recordedAt: 2,
        taskId: 't1',
        workSessionId: 's1',
        originalEstimateMinutes: 30,
        totalFocusedTimeSeconds: 1800,
        completedAtEpochMs: 2,
      }),
      sessionCompleted('s2', 3),
    ];
    const scoped = selectFactsForWorkSessions(facts, new Set(['s1']));
    expect(scoped.map((fact) => fact.kind)).toEqual(
      expect.arrayContaining(['task-completed', 'work-session-completed'])
    );
    expect(scoped.some((fact) => fact.payload.workSessionId === 's2')).toBe(false);
  });

  it('selects reminder occurrences for non-neutral windows', () => {
    const facts = [
      createReminderOccurrenceResolvedFact({
        factId: 'reminder-1',
        recordedAt: 1,
        logicalOutcomeId: 'o1',
        occurrenceIds: ['occ-1'],
        outcome: 'satisfied',
        resolvedAtEpochMs: 1,
      }),
      createReminderOccurrenceResolvedFact({
        factId: 'reminder-2',
        recordedAt: 2,
        logicalOutcomeId: 'o2',
        occurrenceIds: ['occ-2'],
        outcome: 'missed',
        resolvedAtEpochMs: 2,
      }),
    ];
    expect(selectReminderOccurrenceFacts(facts, 'all-time')).toHaveLength(2);
    expect(selectReminderOccurrenceFacts(facts, 'recent-5')).toHaveLength(2);
  });

  it('includes full-lifetime focused time when selecting task completions', () => {
    const facts = [
      sessionCompleted('s1', 100),
      createTaskCompletedFact({
        factId: 'task-completed-t1',
        recordedAt: 100,
        taskId: 't1',
        workSessionId: 's1',
        originalEstimateMinutes: 60,
        totalFocusedTimeSeconds: 1000,
        completedAtEpochMs: 100,
      }),
      createTaskFocusedTimeAttributedFact({
        factId: 'attr-1',
        recordedAt: 50,
        workSessionId: 's0',
        taskId: 't1',
        seconds: 500,
        attributedAt: 50,
        focusBlockIndex: 0,
        intervalStartedAt: 1,
        intervalEndedAt: 2,
      }),
    ];
    const completions = selectTaskCompletionFactsInWindow(facts, 'all-time');
    expect(completions).toHaveLength(1);
    expect(totalFocusedTimeSecondsForTask(facts, 't1', completions[0]!)).toBe(1000);
  });

  it('keeps incomplete sessions in the resolved session window', () => {
    const facts = [sessionCompleted('s1', 1, false)];
    expect(selectResolvedWorkSessionIds(facts, 'all-time')).toEqual(['s1']);
  });
});
