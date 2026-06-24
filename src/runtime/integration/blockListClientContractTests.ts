import { describe, expect, it } from 'vitest';
import type { BlockListClient } from '../blockListTypes';

export const describeBlockListClientContractTests = (
  suiteName: string,
  createClient: () => Promise<BlockListClient>
): void => {
  describe(`block list client contract (${suiteName})`, () => {
    it('returns the current Block List snapshot', async () => {
      const client = await createClient();
      const current = await client.current();
      expect(current.ok).toBe(true);
      if (current.ok) {
        expect(current.value.revision).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(current.value.value.entries)).toBe(true);
      }
    });

    it('commits an add-entry command', async () => {
      const client = await createClient();
      const changed = await client.addEntry('example.com');
      expect(changed).toMatchObject({
        ok: true,
        snapshot: { value: { entries: expect.arrayContaining(['example.com']) } },
      });
    });

    it('publishes subscription updates after commands', async () => {
      const client = await createClient();
      const revisions: number[] = [];
      const unsubscribe = client.subscribe((snapshot) => {
        revisions.push(snapshot.revision);
      });

      await client.addEntry('subscribe.test');
      unsubscribe();

      expect(revisions.length).toBeGreaterThan(0);
    });

    it('rejects invalid entries without committing', async () => {
      const client = await createClient();
      const rejected = await client.addEntry('not a valid hostname');
      expect(rejected).toEqual({
        ok: false,
        error: { kind: 'invalid-entry-input' },
      });
    });

    it('rejects duplicate entries', async () => {
      const client = await createClient();
      await client.addEntry('duplicate.test');
      const rejected = await client.addEntry('https://duplicate.test');
      expect(rejected).toMatchObject({
        ok: false,
        error: { kind: 'duplicate-entry', hostname: 'duplicate.test' },
      });
    });

    it('removes an existing entry', async () => {
      const client = await createClient();
      await client.addEntry('remove-me.test');
      const removed = await client.removeEntry('remove-me.test');
      expect(removed.ok).toBe(true);
      if (removed.ok) {
        expect(removed.snapshot.value.entries).not.toContain('remove-me.test');
      }
    });
  });
};
