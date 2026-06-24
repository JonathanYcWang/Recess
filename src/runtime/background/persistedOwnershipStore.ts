import type { KeyValueStorageAdapter } from '@/modules/persisted-application-state';
import type {
  EnforcementOwnershipStore,
  RememberedOwnership,
} from '@/modules/block-list-enforcement';

export const REMEMBERED_BLOCKED_URLS_KEY = '__recess_remembered_blocked_urls';

export const createPersistedOwnershipStore = (
  adapter: KeyValueStorageAdapter
): EnforcementOwnershipStore => ({
  async read(): Promise<RememberedOwnership> {
    const stored = await adapter.get(REMEMBERED_BLOCKED_URLS_KEY);
    if (!stored.ok || stored.value === null) {
      return { rememberedUrls: [] };
    }
    try {
      const parsed = JSON.parse(stored.value) as unknown;
      if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === 'string')) {
        return { rememberedUrls: [] };
      }
      return { rememberedUrls: parsed };
    } catch {
      return { rememberedUrls: [] };
    }
  },

  async commit(remembered: RememberedOwnership): Promise<void> {
    const result = await adapter.set(
      REMEMBERED_BLOCKED_URLS_KEY,
      JSON.stringify(remembered.rememberedUrls)
    );
    if (!result.ok) {
      throw new Error('failed to persist remembered blocked URLs');
    }
  },
});
