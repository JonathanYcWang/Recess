import type { AccessContext } from '@/modules/block-list';

export const ACCESS_CONTEXT_STORAGE_KEY = '__recess_access_context';

export const isAccessContext = (value: unknown): value is AccessContext => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.phase === 'string' && Array.isArray(candidate.blockListEntries);
};
