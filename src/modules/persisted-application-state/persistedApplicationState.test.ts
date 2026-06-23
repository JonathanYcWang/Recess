import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createDiagnosticRingBuffer,
  createPersistedApplicationState,
  describeSettingsDocumentIntegrationTests,
  settingsCodec,
} from '@/modules/persisted-application-state';
import { createDefaultSettingsValue } from '@/modules/persisted-application-state/settings/settingsDocument';
import {
  clearJournalEntry,
  readJournalEntry,
  writeJournalEntry,
} from '@/modules/persisted-application-state/journal/transactionJournal';

import { SETTINGS_DOCUMENT_KEY } from '@/modules/persisted-application-state/registry/documentRegistry';

describeSettingsDocumentIntegrationTests(createInMemoryKeyValueAdapter, 'in-memory');

describe('settings codec', () => {
  it('accepts valid documents and rejects unsupported versions', () => {
    const valid = settingsCodec.decode({
      schemaVersion: 1,
      revision: 2,
      value: createDefaultSettingsValue(),
    });
    expect(valid.ok).toBe(true);

    const invalid = settingsCodec.decode({
      schemaVersion: 99,
      revision: 0,
      value: createDefaultSettingsValue(),
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.kind).toBe('unsupported-version');
    }
  });

  it('defaults the preference when decoding an older Settings value', () => {
    const olderValue: Partial<ReturnType<typeof createDefaultSettingsValue>> =
      createDefaultSettingsValue();
    delete olderValue.themePreference;
    const decoded = settingsCodec.decode({
      schemaVersion: 1,
      revision: 2,
      value: olderValue,
    });

    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.value.value.themePreference).toBe('system');
    }
  });
});

describe('document registry initialize', () => {
  it('defaults only the affected document and records diagnostic input', async () => {
    const adapter = createInMemoryKeyValueAdapter({
      [SETTINGS_DOCUMENT_KEY]: JSON.stringify({ schemaVersion: 1, revision: 0, value: null }),
    });
    const diagnostics = createDiagnosticRingBuffer();
    const state = createPersistedApplicationState({ adapter, diagnostics });
    const initialized = await state.initialize();
    expect(initialized.ok).toBe(true);
    expect(diagnostics.all().some((entry) => entry.category === 'codec-corruption')).toBe(true);
  });
});

describe('roll-forward journal', () => {
  it('recovers interrupted commits without duplicate mutations', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const defaultDocument = settingsCodec.createDefault();
    const nextDocument = {
      ...defaultDocument,
      revision: 1,
      value: { ...createDefaultSettingsValue(), hasOnboarded: true },
    };
    const encodedDocument = settingsCodec.encode(nextDocument);

    await writeJournalEntry(adapter, {
      transactionId: 'txn-1',
      documentKey: SETTINGS_DOCUMENT_KEY,
      expectedRevision: 0,
      nextRevision: 1,
      encodedDocument,
      phase: 'pending-document-write',
    });

    const state = createPersistedApplicationState({ adapter });
    const initialized = await state.initialize();
    expect(initialized.ok).toBe(true);
    if (initialized.ok) {
      expect(initialized.value.documents.settings.revision).toBe(1);
      expect(initialized.value.documents.settings.value.hasOnboarded).toBe(true);
    }

    const journal = await readJournalEntry(adapter);
    expect(journal.ok).toBe(true);
    if (journal.ok) {
      expect(journal.value).toBeNull();
    }
  });

  it('interrupts every journal phase deterministically', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const defaultDocument = settingsCodec.createDefault();
    const nextDocument = {
      ...defaultDocument,
      revision: 1,
      value: { ...createDefaultSettingsValue(), blockedSites: ['phase.test'] },
    };
    const encodedDocument = settingsCodec.encode(nextDocument);

    await writeJournalEntry(adapter, {
      transactionId: 'txn-phase',
      documentKey: SETTINGS_DOCUMENT_KEY,
      expectedRevision: 0,
      nextRevision: 1,
      encodedDocument,
      phase: 'pending-journal-clear',
    });
    await adapter.set(SETTINGS_DOCUMENT_KEY, JSON.stringify(encodedDocument));

    const state = createPersistedApplicationState({ adapter });
    const initialized = await state.initialize();
    expect(initialized.ok).toBe(true);
    if (initialized.ok) {
      expect(initialized.value.documents.settings.value.blockedSites).toEqual(['phase.test']);
    }
    expect(await readJournalEntry(adapter)).toEqual({ ok: true, value: null });
  });

  it('does not partially apply stale revision commits', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const state = createPersistedApplicationState({ adapter });
    await state.initialize();
    await adapter.set(
      SETTINGS_DOCUMENT_KEY,
      JSON.stringify(
        settingsCodec.encode({
          ...settingsCodec.createDefault(),
          revision: 3,
        })
      )
    );
    const stale = await state.commit([
      {
        document: 'settings',
        expectedRevision: 1,
        value: createDefaultSettingsValue(),
      },
    ]);
    expect(stale.ok).toBe(false);
    const current = await state.read('settings');
    expect(current.ok).toBe(true);
    if (current.ok) {
      expect(current.value.revision).toBe(3);
    }
    await clearJournalEntry(adapter);
  });
});
