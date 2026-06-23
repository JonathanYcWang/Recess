import type {
  KeyValueStorageAdapter,
  Result,
  StorageError,
} from '@/modules/persisted-application-state/types';

const isChromeStorageAvailable = (): boolean =>
  typeof globalThis.chrome !== 'undefined' && globalThis.chrome?.storage?.local !== undefined;

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

export const createChromiumKeyValueAdapter = (): KeyValueStorageAdapter => ({
  get(key: string): Promise<Result<string | null, StorageError>> {
    if (!isChromeStorageAvailable()) {
      return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
    }
    return new Promise((resolve) => {
      globalThis.chrome.storage.local.get([key], (result) => {
        const runtimeError = globalThis.chrome.runtime?.lastError;
        if (runtimeError) {
          resolve({ ok: false, error: toStorageError(runtimeError) });
          return;
        }
        const value = result[key];
        if (value === undefined) {
          resolve({ ok: true, value: null });
          return;
        }
        if (typeof value !== 'string') {
          resolve({
            ok: false,
            error: { kind: 'read-failed', cause: new Error('Stored value is not a string') },
          });
          return;
        }
        resolve({ ok: true, value });
      });
    });
  },

  set(key: string, value: string): Promise<Result<void, StorageError>> {
    if (!isChromeStorageAvailable()) {
      return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
    }
    return new Promise((resolve) => {
      globalThis.chrome.storage.local.set({ [key]: value }, () => {
        const runtimeError = globalThis.chrome.runtime?.lastError;
        if (runtimeError) {
          resolve({ ok: false, error: toStorageError(runtimeError) });
          return;
        }
        resolve({ ok: true, value: undefined });
      });
    });
  },

  remove(key: string): Promise<Result<void, StorageError>> {
    if (!isChromeStorageAvailable()) {
      return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
    }
    return new Promise((resolve) => {
      globalThis.chrome.storage.local.remove([key], () => {
        const runtimeError = globalThis.chrome.runtime?.lastError;
        if (runtimeError) {
          resolve({ ok: false, error: toStorageError(runtimeError) });
          return;
        }
        resolve({ ok: true, value: undefined });
      });
    });
  },

  removeAll(keys: readonly string[]): Promise<Result<void, StorageError>> {
    if (!isChromeStorageAvailable()) {
      return Promise.resolve({ ok: false, error: { kind: 'unavailable' } });
    }
    return new Promise((resolve) => {
      globalThis.chrome.storage.local.remove([...keys], () => {
        const runtimeError = globalThis.chrome.runtime?.lastError;
        if (runtimeError) {
          resolve({ ok: false, error: toStorageError(runtimeError) });
          return;
        }
        resolve({ ok: true, value: undefined });
      });
    });
  },
});
