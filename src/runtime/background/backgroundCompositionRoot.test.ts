import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createBackgroundCompositionRoot } from '@/runtime';

describe('background composition root', () => {
  it('changes one Settings preference through an intent command', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    expect(root.ok).toBe(true);
    if (!root.ok) {
      return;
    }

    const changed = await root.value.settings.setThemePreference('dark');

    expect(changed).toMatchObject({
      ok: true,
      revision: 1,
      snapshot: {
        schemaVersion: 1,
        revision: 1,
        value: { themePreference: 'dark' },
      },
    });
  });

  it('returns caller-safe snapshots', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected runtime initialization to succeed');
    }

    const changed = await root.value.settings.setThemePreference('light');
    if (!changed.ok) {
      throw new Error('expected Settings command to succeed');
    }
    changed.snapshot.value.blockedSites.push('caller-only.test');

    const current = await root.value.settings.current();
    expect(current.ok).toBe(true);
    if (current.ok) {
      expect(current.value.revision).toBe(1);
      expect(current.value.value.themePreference).toBe('light');
      expect(current.value.value.blockedSites).not.toContain('caller-only.test');
    }
  });

  it('rejects unsupported preferences without committing', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected runtime initialization to succeed');
    }

    const rejected = await root.value.settings.setThemePreference('sepia' as never);
    expect(rejected).toEqual({
      ok: false,
      error: { kind: 'invalid-theme-preference' },
    });

    const current = await root.value.settings.current();
    expect(current).toMatchObject({
      ok: true,
      value: { revision: 0, value: { themePreference: 'system' } },
    });
  });

  it('reconstructs the durable preference through a new composition root', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const firstRoot = await createBackgroundCompositionRoot({ adapter });
    if (!firstRoot.ok) {
      throw new Error('expected first runtime initialization to succeed');
    }
    await firstRoot.value.settings.setThemePreference('dark');

    const reconstructedRoot = await createBackgroundCompositionRoot({ adapter });
    if (!reconstructedRoot.ok) {
      throw new Error('expected reconstructed runtime initialization to succeed');
    }
    const current = await reconstructedRoot.value.settings.current();

    expect(current).toMatchObject({
      ok: true,
      value: {
        revision: 1,
        value: { themePreference: 'dark' },
      },
    });
  });
});
