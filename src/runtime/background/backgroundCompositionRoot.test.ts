import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '@/modules/persisted-application-state';
import { createDefaultSettingsValue } from '@/modules/persisted-application-state/settings/settingsDocument';
import { createBackgroundCompositionRoot } from '@/runtime';

describe('background composition root', () => {
  it('returns caller-safe snapshots', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected runtime initialization to succeed');
    }

    const current = await root.value.settings.current();
    if (!current.ok) {
      throw new Error('expected Settings current to succeed');
    }
    current.value.value.blockedSites.push('caller-only.test');

    const again = await root.value.settings.current();
    expect(again.ok).toBe(true);
    if (again.ok) {
      expect(again.value.value.blockedSites).not.toContain('caller-only.test');
    }
  });

  it('reconstructs durable settings through a new composition root', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const persistence = createPersistedApplicationState({ adapter });
    await persistence.initialize();
    await persistence.commit([
      {
        document: 'settings',
        expectedRevision: 0,
        value: { ...createDefaultSettingsValue(), hasOnboarded: true },
      },
    ]);

    const root = await createBackgroundCompositionRoot({ adapter });
    if (!root.ok) {
      throw new Error('expected runtime initialization to succeed');
    }
    const current = await root.value.settings.current();

    expect(current).toMatchObject({
      ok: true,
      value: {
        revision: 1,
        value: { hasOnboarded: true },
      },
    });
  });
});
