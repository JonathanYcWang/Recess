import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '../persistedApplicationState';
import type { KeyValueStorageAdapter } from '../types';

export const describeSettingsDocumentIntegrationTests = (
  createAdapter: () => KeyValueStorageAdapter,
  suiteName: string
): void => {
  describe(`${suiteName} settings document integration tests`, () => {
    it('initializes fresh defaults without exposing storage keys', async () => {
      const adapter = createAdapter();
      const state = createPersistedApplicationState({ adapter });
      const initialized = await state.initialize();
      expect(initialized.ok).toBe(true);
      if (!initialized.ok) {
        return;
      }
      expect(initialized.value.documents.settings.revision).toBe(0);
    });

    it('round trips valid documents through read and commit', async () => {
      const adapter = createAdapter();
      const state = createPersistedApplicationState({ adapter });
      await state.initialize();
      const nextValue = {
        themePreference: 'system' as const,
        workHours: [],
        blockedSites: ['example.com'],
        hasOnboarded: true,
        quiz: {
          currentQuestionId: 'Q1',
          selectedChoices: [],
          isComplete: false,
          results: null,
        },
      };
      const committed = await state.commit([
        { document: 'settings', expectedRevision: 0, value: nextValue },
      ]);
      expect(committed.ok).toBe(true);
      const read = await state.read('settings');
      expect(read.ok).toBe(true);
      if (read.ok) {
        expect(read.value.revision).toBe(1);
        expect(read.value.value.hasOnboarded).toBe(true);
      }
    });

    it('rejects invalid stored documents during initialize', async () => {
      const adapter = createInMemoryKeyValueAdapter({
        __recess_doc_settings: JSON.stringify({ schemaVersion: 1, revision: 0, value: 'bad' }),
      });
      const state = createPersistedApplicationState({ adapter });
      const initialized = await state.initialize();
      expect(initialized.ok).toBe(true);
    });

    it('assigns monotonic revisions and rejects stale commits', async () => {
      const adapter = createAdapter();
      const state = createPersistedApplicationState({ adapter });
      await state.initialize();
      const first = await state.commit([
        {
          document: 'settings',
          expectedRevision: 0,
          value: {
            themePreference: 'system',
            workHours: [],
            blockedSites: [],
            hasOnboarded: true,
            quiz: {
              currentQuestionId: 'Q1',
              selectedChoices: [],
              isComplete: false,
              results: null,
            },
          },
        },
      ]);
      expect(first.ok).toBe(true);
      const stale = await state.commit([
        {
          document: 'settings',
          expectedRevision: 0,
          value: {
            themePreference: 'system',
            workHours: [],
            blockedSites: [],
            hasOnboarded: false,
            quiz: {
              currentQuestionId: 'Q1',
              selectedChoices: [],
              isComplete: false,
              results: null,
            },
          },
        },
      ]);
      expect(stale.ok).toBe(false);
      if (!stale.ok) {
        expect(stale.error.kind).toBe('conflict');
      }
    });
  });
};

export const describeKeyValueAdapterIntegrationTests = (
  createAdapter: () => KeyValueStorageAdapter,
  suiteName: string
): void => {
  describe(`${suiteName} key-value adapter integration tests`, () => {
    it('returns unavailable or null when storage is missing', async () => {
      const adapter = createAdapter();
      const read = await adapter.get('missing-key');
      if (!read.ok) {
        expect(read.error.kind).toBe('unavailable');
        return;
      }
      expect(read.value).toBeNull();
    });

    it('persists and reads string values', async () => {
      const adapter = createAdapter();
      const write = await adapter.set('test-key', 'test-value');
      expect(write.ok).toBe(true);
      const read = await adapter.get('test-key');
      expect(read.ok).toBe(true);
      if (read.ok) {
        expect(read.value).toBe('test-value');
      }
    });
  });
};
