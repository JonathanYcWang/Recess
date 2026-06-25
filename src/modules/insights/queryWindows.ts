import type { WorkHistoryFact } from '@/modules/work-history';
import {
  compareReminderOccurrences,
  compareResolvedWorkSessions,
  type InsightWindow,
  windowLimit,
} from './types';

const isResolvedWorkSession = (fact: WorkHistoryFact): boolean =>
  fact.kind === 'work-session-completed' && typeof fact.payload.workSessionId === 'string';

const isReminderOccurrence = (fact: WorkHistoryFact): boolean =>
  fact.kind === 'reminder-occurrence-resolved' &&
  (fact.payload.outcome === 'satisfied' || fact.payload.outcome === 'missed');

export const selectResolvedWorkSessionIds = (
  facts: readonly WorkHistoryFact[],
  window: InsightWindow
): string[] => {
  const resolved = facts.filter(isResolvedWorkSession).sort(compareResolvedWorkSessions);
  const limit = windowLimit(window);
  const selected = limit === null ? resolved : resolved.slice(Math.max(0, resolved.length - limit));
  return selected.map((fact) => String(fact.payload.workSessionId));
};

export const selectFactsForWorkSessions = (
  facts: readonly WorkHistoryFact[],
  sessionIds: ReadonlySet<string>
): WorkHistoryFact[] =>
  facts.filter((fact) => {
    const sessionId = fact.payload.workSessionId;
    if (typeof sessionId === 'string' && sessionIds.has(sessionId)) {
      return true;
    }
    if (fact.kind === 'task-completed' || fact.kind === 'task-focused-time-attributed') {
      const taskSessionId = fact.payload.workSessionId;
      return typeof taskSessionId === 'string' && sessionIds.has(taskSessionId);
    }
    return false;
  });

export const selectReminderOccurrenceFacts = (
  facts: readonly WorkHistoryFact[],
  window: InsightWindow
): WorkHistoryFact[] => {
  const resolved = facts.filter(isReminderOccurrence).sort(compareReminderOccurrences);
  const limit = windowLimit(window);
  return limit === null ? resolved : resolved.slice(Math.max(0, resolved.length - limit));
};

export const selectTaskCompletionFactsInWindow = (
  facts: readonly WorkHistoryFact[],
  window: InsightWindow
): WorkHistoryFact[] => {
  const sessionIds = new Set(selectResolvedWorkSessionIds(facts, window));
  return facts.filter(
    (fact) =>
      fact.kind === 'task-completed' &&
      typeof fact.payload.completedAtEpochMs === 'number' &&
      typeof fact.payload.taskId === 'string' &&
      (window === 'all-time' ||
        (typeof fact.payload.workSessionId === 'string' &&
          sessionIds.has(fact.payload.workSessionId)))
  );
};

export const totalFocusedTimeSecondsForTask = (
  facts: readonly WorkHistoryFact[],
  taskId: string,
  completionFact: WorkHistoryFact
): number => {
  const attributed = facts
    .filter(
      (fact) => fact.kind === 'task-focused-time-attributed' && fact.payload.taskId === taskId
    )
    .reduce((sum, fact) => sum + Number(fact.payload.seconds ?? 0), 0);
  const completionTotal = Number(completionFact.payload.totalFocusedTimeSeconds ?? 0);
  return Math.max(attributed, completionTotal);
};
