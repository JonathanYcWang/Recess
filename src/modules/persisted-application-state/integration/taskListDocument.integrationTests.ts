import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createPersistedApplicationState } from '../persistedApplicationState';
import type { KeyValueStorageAdapter } from '../types';
import { TASK_LIST_DOCUMENT_KEY } from '../registry/documentRegistry';
import { taskListCodec } from '@/modules/task-list';
import { createDefaultTaskListValue } from '@/modules/task-list/taskListDocument';

export const describeTaskListDocumentIntegrationTests = (
  createAdapter: () => KeyValueStorageAdapter,
  suiteName: string
): void => {
  describe(`${suiteName} task list document integration tests`, () => {
    it('initializes fresh defaults', async () => {
      const adapter = createAdapter();
      const state = createPersistedApplicationState({ adapter });
      const initialized = await state.initialize();
      expect(initialized.ok).toBe(true);
      if (!initialized.ok) {
        return;
      }
      expect(initialized.value.documents['task-list'].revision).toBe(0);
      expect(initialized.value.documents['task-list'].value.tasks).toEqual([]);
    });

    it('round trips valid documents through read and commit', async () => {
      const adapter = createAdapter();
      const state = createPersistedApplicationState({ adapter });
      await state.initialize();
      const nextValue = {
        tasks: [
          {
            id: 'task-1',
            title: 'Plan sprint',
            status: 'to-do' as const,
            originalEstimateMinutes: 30,
            focusedTimeSeconds: 0,
            createdAtEpochMs: 100,
            updatedAtEpochMs: 100,
          },
        ],
      };
      const committed = await state.commit([
        { document: 'task-list', expectedRevision: 0, value: nextValue },
      ]);
      expect(committed.ok).toBe(true);
      const read = await state.read('task-list');
      expect(read.ok).toBe(true);
      if (read.ok) {
        expect(read.value.revision).toBe(1);
        expect(read.value.value.tasks[0].title).toBe('Plan sprint');
      }
    });

    it('rejects invalid stored documents during initialize', async () => {
      const adapter = createInMemoryKeyValueAdapter({
        [TASK_LIST_DOCUMENT_KEY]: JSON.stringify({ schemaVersion: 1, revision: 0, value: 'bad' }),
      });
      const state = createPersistedApplicationState({ adapter });
      const initialized = await state.initialize();
      expect(initialized.ok).toBe(true);
      if (initialized.ok) {
        expect(initialized.value.documents['task-list'].value).toEqual(
          createDefaultTaskListValue()
        );
      }
    });

    it('assigns monotonic revisions and rejects stale commits', async () => {
      const adapter = createAdapter();
      const state = createPersistedApplicationState({ adapter });
      await state.initialize();
      const first = await state.commit([
        { document: 'task-list', expectedRevision: 0, value: createDefaultTaskListValue() },
      ]);
      expect(first.ok).toBe(true);
      const stale = await state.commit([
        { document: 'task-list', expectedRevision: 0, value: createDefaultTaskListValue() },
      ]);
      expect(stale.ok).toBe(false);
      if (!stale.ok) {
        expect(stale.error.kind).toBe('conflict');
      }
    });

    it('accepts valid documents through codec decode', () => {
      const valid = taskListCodec.decode({
        schemaVersion: 1,
        revision: 2,
        value: createDefaultTaskListValue(),
      });
      expect(valid.ok).toBe(true);
    });
  });
};
