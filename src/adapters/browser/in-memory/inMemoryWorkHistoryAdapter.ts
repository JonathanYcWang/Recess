import type { Result } from '@/modules/persisted-application-state/types';
import type {
  WorkHistoryFact,
  WorkHistoryQuery,
  WorkHistoryStorageAdapter,
  WorkHistoryStorageError,
} from '@/modules/work-history/types';

export const createInMemoryWorkHistoryAdapter = (): WorkHistoryStorageAdapter & {
  snapshot: () => readonly WorkHistoryFact[];
  setAvailable: (next: boolean) => void;
} => {
  const facts = new Map<string, WorkHistoryFact>();
  let available = true;

  const filterFacts = (query?: WorkHistoryQuery): WorkHistoryFact[] => {
    let values = [...facts.values()];
    if (query?.fromRecordedAt !== undefined) {
      values = values.filter((fact) => fact.recordedAt >= query.fromRecordedAt!);
    }
    if (query?.toRecordedAt !== undefined) {
      values = values.filter((fact) => fact.recordedAt <= query.toRecordedAt!);
    }
    values.sort((left, right) => {
      if (left.recordedAt !== right.recordedAt) {
        return left.recordedAt - right.recordedAt;
      }
      return left.id.localeCompare(right.id);
    });
    if (query?.limit !== undefined) {
      values = values.slice(0, query.limit);
    }
    return values;
  };

  return {
    async append(batch): Promise<Result<void, WorkHistoryStorageError>> {
      if (!available) {
        return { ok: false, error: { kind: 'unavailable' } };
      }
      for (const fact of batch) {
        if (!fact.id || typeof fact.recordedAt !== 'number') {
          return {
            ok: false,
            error: { kind: 'invalid-fact', message: 'Fact requires id and recordedAt' },
          };
        }
        facts.set(fact.id, fact);
      }
      return { ok: true, value: undefined };
    },

    async query(query): Promise<Result<readonly WorkHistoryFact[], WorkHistoryStorageError>> {
      if (!available) {
        return { ok: false, error: { kind: 'unavailable' } };
      }
      return { ok: true, value: filterFacts(query) };
    },

    async clear(): Promise<Result<void, WorkHistoryStorageError>> {
      if (!available) {
        return { ok: false, error: { kind: 'unavailable' } };
      }
      facts.clear();
      return { ok: true, value: undefined };
    },

    setAvailable(next: boolean) {
      available = next;
    },

    snapshot() {
      return filterFacts();
    },
  };
};
