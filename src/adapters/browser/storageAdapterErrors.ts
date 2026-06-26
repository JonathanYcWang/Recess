import type { StorageError } from '@/modules/persisted-application-state/types';

export const toStorageError = (cause: unknown): StorageError => {
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

export const unavailableResult = () => ({ ok: false, error: { kind: 'unavailable' } }) as const;
