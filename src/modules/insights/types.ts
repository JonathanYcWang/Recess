import type { WorkHistoryFact } from '@/modules/work-history';

export type InsightWindow = 'recent-5' | 'recent-30' | 'all-time';

export type InsightFamily = 'session-task' | 'reminder';

export type InsightResultState =
  | 'no-relevant-data'
  | 'insufficient-data'
  | 'explicit-zero'
  | 'calculated'
  | 'query-error';

export interface InsightExplanation {
  formulaId: string;
  formulaVersion: number;
  inputs: Record<string, string | number | boolean>;
  sourceFactIds: readonly string[];
}

export interface InsightResult<TValue> {
  state: InsightResultState;
  value: TValue | null;
  explanation: InsightExplanation | null;
  requiredCount?: number;
  actualCount?: number;
}

export interface InsightQueryError {
  kind: 'query-failed';
  cause?: unknown;
}

export type InsightQueryOutcome<TValue> =
  | { ok: true; value: InsightResult<TValue> }
  | { ok: false; error: InsightQueryError };

export const compareResolvedWorkSessions = (
  left: WorkHistoryFact,
  right: WorkHistoryFact
): number => {
  const leftCompletedAt = Number(left.payload.completedAt ?? left.recordedAt);
  const rightCompletedAt = Number(right.payload.completedAt ?? right.recordedAt);
  if (leftCompletedAt !== rightCompletedAt) {
    return leftCompletedAt - rightCompletedAt;
  }
  return left.id.localeCompare(right.id);
};

export const compareReminderOccurrences = (
  left: WorkHistoryFact,
  right: WorkHistoryFact
): number => {
  const leftResolvedAt = Number(left.payload.resolvedAtEpochMs ?? left.recordedAt);
  const rightResolvedAt = Number(right.payload.resolvedAtEpochMs ?? right.recordedAt);
  if (leftResolvedAt !== rightResolvedAt) {
    return leftResolvedAt - rightResolvedAt;
  }
  return left.id.localeCompare(right.id);
};

export const windowLimit = (window: InsightWindow): number | null => {
  if (window === 'recent-5') {
    return 5;
  }
  if (window === 'recent-30') {
    return 30;
  }
  return null;
};
