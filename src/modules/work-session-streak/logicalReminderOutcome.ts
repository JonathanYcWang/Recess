import type { ReminderOccurrence, WorkStartReminderValue } from '@/modules/work-start-reminder';
import type { WorkSessionStreakValue } from './workSessionStreakDocument';

export interface LogicalReminderOutcome {
  logicalOutcomeId: string;
  occurrenceIds: readonly string[];
  outcome: 'satisfied' | 'missed';
  resolvedAtEpochMs: number;
  workSessionId?: string;
}

export const logicalReminderOutcomeId = (occurrenceIds: readonly string[]): string =>
  [...occurrenceIds].sort().join('+');

const groupKeyForOccurrence = (occurrence: ReminderOccurrence): string | null => {
  if (occurrence.phase !== 'resolved') {
    return null;
  }
  if (occurrence.outcome !== 'satisfied' && occurrence.outcome !== 'missed') {
    return null;
  }
  if (typeof occurrence.resolvedAtEpochMs !== 'number') {
    return null;
  }
  return `${occurrence.outcome}:${occurrence.resolvedAtEpochMs}:${occurrence.resolvedBySessionId ?? ''}`;
};

export const groupOccurrencesIntoLogicalOutcomes = (
  occurrences: readonly ReminderOccurrence[]
): LogicalReminderOutcome[] => {
  const groups = new Map<string, ReminderOccurrence[]>();
  for (const occurrence of occurrences) {
    const key = groupKeyForOccurrence(occurrence);
    if (!key) {
      continue;
    }
    const current = groups.get(key) ?? [];
    current.push(occurrence);
    groups.set(key, current);
  }

  return [...groups.values()]
    .map((group) => {
      const occurrenceIds = group.map((entry) => entry.id);
      const sample = group[0]!;
      return {
        logicalOutcomeId: logicalReminderOutcomeId(occurrenceIds),
        occurrenceIds,
        outcome: sample.outcome as 'satisfied' | 'missed',
        resolvedAtEpochMs: sample.resolvedAtEpochMs!,
        workSessionId: sample.resolvedBySessionId,
      };
    })
    .sort((left, right) => left.resolvedAtEpochMs - right.resolvedAtEpochMs);
};

export const extractNewLogicalReminderOutcomes = (
  before: WorkStartReminderValue,
  after: WorkStartReminderValue
): LogicalReminderOutcome[] => {
  const previouslyResolvedIds = new Set(
    before.occurrences
      .filter(
        (occurrence) =>
          occurrence.phase === 'resolved' &&
          (occurrence.outcome === 'satisfied' || occurrence.outcome === 'missed')
      )
      .map((occurrence) => occurrence.id)
  );
  const newlyResolved = after.occurrences.filter(
    (occurrence) =>
      occurrence.phase === 'resolved' &&
      (occurrence.outcome === 'satisfied' || occurrence.outcome === 'missed') &&
      !previouslyResolvedIds.has(occurrence.id)
  );
  return groupOccurrencesIntoLogicalOutcomes(newlyResolved);
};

export const pendingLogicalReminderOutcomes = (
  streak: WorkSessionStreakValue,
  reminder: WorkStartReminderValue
): LogicalReminderOutcome[] => {
  const processed = new Set(streak.processedLogicalOutcomeIds);
  return groupOccurrencesIntoLogicalOutcomes(reminder.occurrences).filter(
    (outcome) => !processed.has(outcome.logicalOutcomeId)
  );
};
