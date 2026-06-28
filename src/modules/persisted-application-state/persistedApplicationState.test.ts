import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import {
  createPersistedApplicationState,
  describeSettingsDocumentIntegrationTests,
  settingsCodec,
} from '@/modules/persisted-application-state';
import { describeTaskListDocumentIntegrationTests } from '@/modules/persisted-application-state/integration/taskListDocument.integrationTests';
import { createDefaultSettingsValue } from '@/modules/persisted-application-state/settings/settingsDocument';

import { SETTINGS_DOCUMENT_KEY } from '@/modules/persisted-application-state/registry/documentRegistry';

describeSettingsDocumentIntegrationTests(createInMemoryKeyValueAdapter, 'in-memory');
describeTaskListDocumentIntegrationTests(createInMemoryKeyValueAdapter, 'in-memory');

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
  it('defaults only the affected document when storage contains an invalid document', async () => {
    const adapter = createInMemoryKeyValueAdapter({
      [SETTINGS_DOCUMENT_KEY]: JSON.stringify({ schemaVersion: 1, revision: 0, value: null }),
    });
    const state = createPersistedApplicationState({ adapter });
    const initialized = await state.initialize();
    expect(initialized.ok).toBe(true);
    if (initialized.ok) {
      expect(initialized.value.documents.settings.value.themePreference).toBe('system');
    }
  });
});

describe('roll-forward journal', () => {;
});
