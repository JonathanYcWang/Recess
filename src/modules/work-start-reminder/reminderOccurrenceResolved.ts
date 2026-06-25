import type { WorkHistoryFact } from '@/modules/work-history';
import { withSchemaVersion } from '@/modules/work-history/factCodec';

export interface ReminderOccurrenceResolvedContext {
  factId: string;
  recordedAt: number;
  logicalOutcomeId: string;
  occurrenceIds: readonly string[];
  outcome: 'satisfied' | 'missed';
  resolvedAtEpochMs: number;
  workSessionId?: string;
}

export const reminderOccurrenceResolvedFactId = (logicalOutcomeId: string): string =>
  `reminder-occurrence-${logicalOutcomeId}`;

export const createReminderOccurrenceResolvedFact = (
  context: ReminderOccurrenceResolvedContext
): WorkHistoryFact =>
  withSchemaVersion({
    id: context.factId,
    recordedAt: context.recordedAt,
    kind: 'reminder-occurrence-resolved',
    payload: {
      logicalOutcomeId: context.logicalOutcomeId,
      occurrenceIds: context.occurrenceIds.join(','),
      outcome: context.outcome,
      resolvedAtEpochMs: context.resolvedAtEpochMs,
      workSessionId: context.workSessionId ?? null,
    },
  });
