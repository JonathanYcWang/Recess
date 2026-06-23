import type {
  KeyValueStorageAdapter,
  Result,
  StorageError,
} from '@/modules/persisted-application-state/types';

type BrowserStorage = {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, string>): Promise<void>;
  remove(keys: string[]): Promise<void>;
};

const getSafariStorage = (): BrowserStorage | null => {
  const browserApi = (globalThis as { browser?: { storage?: { local?: BrowserStorage } } }).browser;
  if (browserApi?.storage?.local) {
    return browserApi.storage.local;
  }
  if (typeof globalThis.chrome !== 'undefined' && globalThis.chrome?.storage?.local !== undefined) {
    const chromeStorage = globalThis.chrome.storage.local;
    return {
      get(keys: string[]) {
        return new Promise((resolve, reject) => {
          chromeStorage.get(keys, (result) => {
            const runtimeError = globalThis.chrome.runtime?.lastError;
            if (runtimeError) {
              reject(runtimeError);
              return;
            }
            resolve(result);
          });
        });
      },
      set(items: Record<string, string>) {
        return new Promise((resolve, reject) => {
          chromeStorage.set(items, () => {
            const runtimeError = globalThis.chrome.runtime?.lastError;
            if (runtimeError) {
              reject(runtimeError);
              return;
            }
            resolve();
          });
        });
      },
      remove(keys: string[]) {
        return new Promise((resolve, reject) => {
          chromeStorage.remove(keys, () => {
            const runtimeError = globalThis.chrome.runtime?.lastError;
            if (runtimeError) {
              reject(runtimeError);
              return;
            }
            resolve();
          });
        });
      },
    };
  }
  return null;
};

const toStorageError = (cause: unknown): StorageError => {
  if (
    typeof cause === 'object' &&
    cause !== null &&
    'message' in cause &&
    typeof cause.message === 'string' &&
    cause.message.includes('QUOTA')
  ) {
    return { kind: 'quota-exceeded' };
  }
  return { kind: 'write-failed', cause };
};

export const createSafariKeyValueAdapter = (): KeyValueStorageAdapter => ({
  async get(key: string): Promise<Result<string | null, StorageError>> {
    const storage = getSafariStorage();
    if (!storage) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    try {
      const result = await storage.get([key]);
      const value = result[key];
      if (value === undefined) {
        return { ok: true, value: null };
      }
      if (typeof value !== 'string') {
        return {
          ok: false,
          error: { kind: 'read-failed', cause: new Error('Stored value is not a string') },
        };
      }
      return { ok: true, value };
    } catch (cause) {
      return { ok: false, error: toStorageError(cause) };
    }
  },

  async set(key: string, value: string): Promise<Result<void, StorageError>> {
    const storage = getSafariStorage();
    if (!storage) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    try {
      await storage.set({ [key]: value });
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: toStorageError(cause) };
    }
  },

  async remove(key: string): Promise<Result<void, StorageError>> {
    const storage = getSafariStorage();
    if (!storage) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    try {
      await storage.remove([key]);
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: toStorageError(cause) };
    }
  },

  async removeAll(keys: readonly string[]): Promise<Result<void, StorageError>> {
    const storage = getSafariStorage();
    if (!storage) {
      return { ok: false, error: { kind: 'unavailable' } };
    }
    try {
      await storage.remove([...keys]);
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: toStorageError(cause) };
    }
  },
});
