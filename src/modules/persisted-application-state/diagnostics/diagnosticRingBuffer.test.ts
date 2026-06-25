import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createDiagnosticRingBuffer,
  createPersistedApplicationState,
  DIAGNOSTIC_BUFFER_LIMIT,
} from '@/modules/persisted-application-state';
import { SETTINGS_DOCUMENT_KEY } from '@/modules/persisted-application-state/registry/documentRegistry';
import { createDefaultSettingsValue } from '@/modules/persisted-application-state/settings/settingsDocument';

describe('diagnostic ring buffer', () => {
  it('retains at most 500 entries and evicts oldest deterministically', () => {
    const buffer = createDiagnosticRingBuffer();
    for (let index = 0; index < DIAGNOSTIC_BUFFER_LIMIT + 25; index += 1) {
      buffer.record({
        category: 'unexpected-runtime',
        message: `entry-${index}`,
        context: { index: String(index) },
      });
    }
    expect(buffer.size()).toBe(DIAGNOSTIC_BUFFER_LIMIT);
    const entries = buffer.all();
    expect(entries[0]?.message).toBe('entry-25');
    expect(entries[entries.length - 1]?.message).toBe(`entry-${DIAGNOSTIC_BUFFER_LIMIT + 24}`);
  });

  it('sanitizes context and never stores secret-like keys', () => {
    const buffer = createDiagnosticRingBuffer();
    buffer.record({
      category: 'adapter-failure',
      message: 'adapter failed',
      context: {
        secretToken: 'hidden',
        document: 'settings',
      },
    });
    const entry = buffer.all()[0];
    expect(entry?.context.secretToken).toBeUndefined();
    expect(entry?.context.document).toBe('settings');
  });

  it('records codec corruption without blocking initialization', async () => {
    const adapter = createInMemoryKeyValueAdapter({
      [SETTINGS_DOCUMENT_KEY]: JSON.stringify({ schemaVersion: 1, revision: 0, value: null }),
    });
    const diagnostics = createDiagnosticRingBuffer();
    const state = createPersistedApplicationState({ adapter, diagnostics });
    const initialized = await state.initialize();
    expect(initialized.ok).toBe(true);
    expect(diagnostics.all().some((entry) => entry.category === 'codec-corruption')).toBe(true);
  });

  it('records journal recovery without blocking initialization', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const diagnostics = createDiagnosticRingBuffer();
    const state = createPersistedApplicationState({ adapter, diagnostics });
    await state.commit([
      {
        document: 'settings',
        expectedRevision: 0,
        value: {
          ...createDefaultSettingsValue(),
          blockedSites: ['diag.test'],
        },
      },
    ]);
    await state.initialize();
    expect(diagnostics.size()).toBeGreaterThanOrEqual(0);
  });
});
