import type { KeyValueStorageAdapter, Result, StorageError } from '@/runtime/persistence/types';

export const createInMemoryKeyValueAdapter = (
  seed?: Record<string, string>
): KeyValueStorageAdapter & {
  setAvailable: (next: boolean) => void;
  snapshot: () => Record<string, string>;
} => {
  const values = new Map<string, string>(Object.entries(seed ?? {}));
  let available = true;

  return {
    get(key: string): Promise<Result<string | null, StorageError>> {
      if (!available) {
        return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
      }
      return Promise.resolve({ ok: true, value: values.get(key) ?? null });
    },

    set(key: string, value: string): Promise<Result<void, StorageError>> {
      if (!available) {
        return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
      }
      values.set(key, value);
      return Promise.resolve({ ok: true, value: undefined });
    },

    remove(key: string): Promise<Result<void, StorageError>> {
      if (!available) {
        return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
      }
      values.delete(key);
      return Promise.resolve({ ok: true, value: undefined });
    },

    removeAll(keys: readonly string[]): Promise<Result<void, StorageError>> {
      if (!available) {
        return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
      }
      for (const key of keys) {
        values.delete(key);
      }
      return Promise.resolve({ ok: true, value: undefined });
    },

    setAvailable(next: boolean) {
      available = next;
    },

    snapshot() {
      return Object.fromEntries(values.entries());
    },
  };
};

export type InMemoryKeyValueAdapter = ReturnType<typeof createInMemoryKeyValueAdapter>;

export const createFailingInMemoryKeyValueAdapter = (
  failure: StorageError
): KeyValueStorageAdapter => ({
  get(): Promise<Result<string | null, StorageError>> {
    return Promise.resolve({ ok: false, error: failure });
  },
  set(): Promise<Result<void, StorageError>> {
    return Promise.resolve({ ok: false, error: failure });
  },
  remove(): Promise<Result<void, StorageError>> {
    return Promise.resolve({ ok: false, error: failure });
  },
});
