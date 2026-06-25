import type { Result } from '@/modules/persisted-application-state/types';

export type WorkHistoryFactKind =
  | 'work-session-started'
  | 'work-session-completed'
  | 'work-session-extended'
  | 'focus-block-completed'
  | 'recess-started'
  | 'recess-completed'
  | 'time-out-started'
  | 'time-out-ended'
  | 'task-focused-time-attributed'
  | 'task-completed'
  | 'reminder-occurrence-resolved';

export interface WorkHistoryFact {
  id: string;
  recordedAt: number;
  kind: WorkHistoryFactKind;
  payload: Record<string, string | number | boolean | null>;
}

export type WorkHistoryQuery = {
  fromRecordedAt?: number;
  toRecordedAt?: number;
  limit?: number;
};

export type WorkHistoryStorageError =
  | { kind: 'unavailable' }
  | { kind: 'transaction-failed'; cause?: unknown }
  | { kind: 'invalid-fact'; message: string };

export interface WorkHistoryStorageAdapter {
  append(facts: readonly WorkHistoryFact[]): Promise<Result<void, WorkHistoryStorageError>>;
  query(
    query?: WorkHistoryQuery
  ): Promise<Result<readonly WorkHistoryFact[], WorkHistoryStorageError>>;
  clear(): Promise<Result<void, WorkHistoryStorageError>>;
}

export interface WorkHistoryService {
  append(facts: readonly WorkHistoryFact[]): Promise<Result<void, WorkHistoryStorageError>>;
  query(
    query?: WorkHistoryQuery
  ): Promise<Result<readonly WorkHistoryFact[], WorkHistoryStorageError>>;
  clear(): Promise<Result<void, WorkHistoryStorageError>>;
}

export const compareWorkHistoryFacts = (left: WorkHistoryFact, right: WorkHistoryFact): number => {
  if (left.recordedAt !== right.recordedAt) {
    return left.recordedAt - right.recordedAt;
  }
  return left.id.localeCompare(right.id);
};

export const sortWorkHistoryFacts = (facts: readonly WorkHistoryFact[]): WorkHistoryFact[] =>
  [...facts].sort(compareWorkHistoryFacts);

export const createWorkHistoryService = (
  adapter: WorkHistoryStorageAdapter
): WorkHistoryService => ({
  async append(facts) {
    return adapter.append(facts);
  },
  async query(query) {
    const result = await adapter.query(query);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: sortWorkHistoryFacts(result.value) };
  },
  async clear() {
    return adapter.clear();
  },
});
