import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createPersistedOwnershipStore,
  REMEMBERED_BLOCKED_URLS_KEY,
} from './persistedOwnershipStore';

describe('persisted ownership store', () => {
  it('reads an empty list when nothing is stored', async () => {
    const store = createPersistedOwnershipStore(createInMemoryKeyValueAdapter());
    await expect(store.read()).resolves.toEqual({ rememberedUrls: [] });
  });

  it('round-trips remembered blocked URLs', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const store = createPersistedOwnershipStore(adapter);

    await store.commit({
      rememberedUrls: ['https://a.test', 'https://b.test'],
    });

    await expect(store.read()).resolves.toEqual({
      rememberedUrls: ['https://a.test', 'https://b.test'],
    });
    await expect(adapter.get(REMEMBERED_BLOCKED_URLS_KEY)).resolves.toEqual({
      ok: true,
      value: JSON.stringify(['https://a.test', 'https://b.test']),
    });
  });

  it('returns an empty list for invalid stored payloads', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    await adapter.set(REMEMBERED_BLOCKED_URLS_KEY, '{not-json');
    const store = createPersistedOwnershipStore(adapter);

    await expect(store.read()).resolves.toEqual({ rememberedUrls: [] });
  });
});
