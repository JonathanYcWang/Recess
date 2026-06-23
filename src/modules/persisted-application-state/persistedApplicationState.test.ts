import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createPersistedApplicationState,
  describeSettingsDocumentIntegrationTests,
  settingsCodec,
} from '@/modules/persisted-application-state';
import { createDefaultSettingsValue } from '@/modules/persisted-application-state/settings/settingsDocument';

const SETTINGS_DOCUMENT_KEY = '__recess_doc_settings';

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
});

describe('settings persistence contract', () => {
  it('defaults invalid stored documents during initialize', async () => {
    const adapter = createInMemoryKeyValueAdapter({
      [SETTINGS_DOCUMENT_KEY]: JSON.stringify({ schemaVersion: 1, revision: 0, value: 'bad' }),
    });
    const state = createPersistedApplicationState({ adapter });
    const initialized = await state.initialize();
    expect(initialized.ok).toBe(true);
    if (initialized.ok) {
      expect(initialized.value.documents.settings).toEqual(settingsCodec.createDefault());
    }
  });
});
