import { afterEach, describe, expect, it, vi } from 'vitest';
import { createIndexedDbWorkHistoryAdapter } from '@/adapters/browser/chromium/indexedDbWorkHistoryAdapter';
import { createSafariIndexedDbWorkHistoryAdapter } from '@/adapters/browser/safari/indexedDbWorkHistoryAdapter';
import { describeWorkHistoryIntegrationTests } from '@/modules/work-history';

type StoreRecord = Record<string, unknown>;

const createFakeIndexedDb = () => {
  const stores = new Map<string, Map<string, StoreRecord>>();

  const ensureStore = (name: string) => {
    if (!stores.has(name)) {
      stores.set(name, new Map());
    }
    return stores.get(name)!;
  };

  const createRequest = <T>(result: T) => {
    const request = {
      result,
      error: null as DOMException | null,
      onsuccess: null as null | (() => void),
      onerror: null as null | (() => void),
    };
    queueMicrotask(() => request.onsuccess?.());
    return request as IDBRequest<T>;
  };

  const database = {
    objectStoreNames: {
      contains: (name: string) => stores.has(name),
    },
    createObjectStore: (name: string) => {
      ensureStore(name);
      return {};
    },
    transaction: (storeName: string) => {
      const store = ensureStore(storeName);
      const transaction = {
        oncomplete: null as null | (() => void),
        onerror: null as null | (() => void),
        objectStore: () => ({
          put: (value: StoreRecord) => {
            store.set(String(value.id), value);
            return createRequest(undefined);
          },
          getAll: () => createRequest([...store.values()]),
          clear: () => {
            store.clear();
            return createRequest(undefined);
          },
          count: () => createRequest(store.size),
        }),
      };
      queueMicrotask(() => transaction.oncomplete?.());
      return transaction;
    },
    close: vi.fn(),
  };

  return {
    open: () => createRequest(database as unknown as IDBDatabase),
    reset: () => stores.clear(),
  };
};

describe('indexeddb work history adapters', () => {
  const fakeDb = createFakeIndexedDb();

  afterEach(() => {
    fakeDb.reset();
    vi.unstubAllGlobals();
  });

  const mountIndexedDb = () => {
    vi.stubGlobal('indexedDB', fakeDb);
  };

  describeWorkHistoryIntegrationTests(() => {
    mountIndexedDb();
    return createIndexedDbWorkHistoryAdapter();
  }, 'chromium-indexeddb');

  describeWorkHistoryIntegrationTests(() => {
    mountIndexedDb();
    return createSafariIndexedDbWorkHistoryAdapter();
  }, 'safari-indexeddb');

  it('reports unavailable storage when indexedDB is missing', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const adapter = createIndexedDbWorkHistoryAdapter();
    const result = await adapter.append([
      {
        id: 'missing-db',
        recordedAt: 1,
        kind: 'work-session-started',
        payload: {},
      },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unavailable');
    }
  });
});
