import type { Result } from '@/runtime/persistence/types';
import type {
  WorkHistoryFact,
  WorkHistoryQuery,
  WorkHistoryStorageAdapter,
  WorkHistoryStorageError,
} from '@/modules/work-history/types';

const DB_NAME = '__recess_work_history';
const DB_VERSION = 1;
const STORE_NAME = 'facts';

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    request.onsuccess = () => resolve(request.result as T);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
};

const isIndexedDbAvailable = (): boolean => typeof indexedDB !== 'undefined';

export const createIndexedDbWorkHistoryAdapter = (): WorkHistoryStorageAdapter => ({
  async append(facts): Promise<Result<void, WorkHistoryStorageError>> {
    if (!isIndexedDbAvailable()) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    try {
      await runTransaction('readwrite', (store) => {
        for (const fact of facts) {
          store.put(fact);
        }
        return store.count();
      });
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { kind: 'transaction-failed', cause } };
    }
  },

  async query(
    query?: WorkHistoryQuery
  ): Promise<Result<readonly WorkHistoryFact[], WorkHistoryStorageError>> {
    if (!isIndexedDbAvailable()) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    try {
      const facts = await runTransaction('readonly', (store) => store.getAll());
      let filtered = facts as WorkHistoryFact[];
      if (query?.fromRecordedAt !== undefined) {
        filtered = filtered.filter((fact) => fact.recordedAt >= query.fromRecordedAt!);
      }
      if (query?.toRecordedAt !== undefined) {
        filtered = filtered.filter((fact) => fact.recordedAt <= query.toRecordedAt!);
      }
      filtered.sort((left, right) => {
        if (left.recordedAt !== right.recordedAt) {
          return left.recordedAt - right.recordedAt;
        }
        return left.id.localeCompare(right.id);
      });
      if (query?.limit !== undefined) {
        filtered = filtered.slice(0, query.limit);
      }
      return { ok: true, value: filtered };
    } catch (cause) {
      return { ok: false, error: { kind: 'transaction-failed', cause } };
    }
  },

  async clear(): Promise<Result<void, WorkHistoryStorageError>> {
    if (!isIndexedDbAvailable()) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    try {
      await runTransaction('readwrite', (store) => store.clear());
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { kind: 'transaction-failed', cause } };
    }
  },
});

export const WORK_HISTORY_DB_NAME = DB_NAME;
