import { describe, expect, it } from 'vitest';
import type { SettingsClient } from '../types';

export const describeSettingsClientContractTests = (
  suiteName: string,
  createClient: () => Promise<SettingsClient>
): void => {
  describe(`settings client contract (${suiteName})`, () => {
    it('returns the current Settings snapshot', async () => {
      const client = await createClient();
      const current = await client.current();
      expect(current).toMatchObject({
        ok: true,
        value: { revision: 0, value: { themePreference: 'system' } },
      });
    });

    it('commits a theme preference through command', async () => {
      const client = await createClient();
      const changed = await client.setThemePreference('dark');
      expect(changed).toMatchObject({
        ok: true,
        revision: 1,
        snapshot: { value: { themePreference: 'dark' } },
      });
    });

    it('publishes subscription updates after commands', async () => {
      const client = await createClient();
      const snapshots: number[] = [];
      const unsubscribe = client.subscribe((snapshot) => {
        snapshots.push(snapshot.revision);
      });

      const initial = await client.current();
      expect(initial.ok).toBe(true);

      await client.setThemePreference('light');
      unsubscribe();

      expect(snapshots).toContain(1);
    });

    it('rejects invalid preferences without committing', async () => {
      const client = await createClient();
      const rejected = await client.setThemePreference('sepia' as never);
      expect(rejected).toEqual({
        ok: false,
        error: { kind: 'invalid-theme-preference' },
      });
    });
  });
};
