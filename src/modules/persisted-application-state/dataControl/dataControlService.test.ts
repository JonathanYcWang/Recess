import { describe, expect, it } from 'vitest';
import { createInMemoryKeyValueAdapter } from '@/adapters/browser/in-memory/inMemoryKeyValueAdapter';
import { createInMemoryWorkHistoryAdapter } from '@/adapters/browser/in-memory/inMemoryWorkHistoryAdapter';
import {
  createDataControlService,
  createDiagnosticRingBuffer,
  createPersistedApplicationState,
  DATA_EXPORT_FORMAT_VERSION,
} from '@/modules/persisted-application-state';
import { createWorkHistoryService } from '@/modules/work-history';

describe('data control service', () => {
  it('exports all operational documents, work history, and diagnostics', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const diagnostics = createDiagnosticRingBuffer();
    diagnostics.record({
      category: 'unexpected-runtime',
      message: 'export test',
      context: { source: 'test' },
    });
    const state = createPersistedApplicationState({ adapter, diagnostics });
    await state.initialize();
    await workHistory.append([
      {
        id: 'history-1',
        recordedAt: 100,
        kind: 'work-session-started',
        payload: { energy: 'steady' },
      },
    ]);

    const service = createDataControlService({ adapter, workHistory, diagnostics });
    const exported = await service.export();
    expect(exported.ok).toBe(true);
    if (exported.ok) {
      expect(exported.value.formatVersion).toBe(DATA_EXPORT_FORMAT_VERSION);
      expect(exported.value.operationalDocuments.settings).toBeDefined();
      expect(exported.value.workHistory).toHaveLength(1);
      expect(exported.value.diagnostics).toHaveLength(1);
      expect(JSON.stringify(exported.value)).not.toContain('__recess_doc_settings');
    }
  });

  it('requires explicit confirmed intent before delete-all', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const diagnostics = createDiagnosticRingBuffer();
    const service = createDataControlService({ adapter, workHistory, diagnostics });
    await createPersistedApplicationState({ adapter }).initialize();

    const unconfirmed = await service.deleteAll({ kind: 'confirm', confirmationToken: 'wrong' });
    expect(unconfirmed.ok).toBe(false);

    const request = service.requestDelete();
    const deleted = await service.deleteAll({
      kind: 'confirm',
      confirmationToken: request.confirmationToken,
    });
    expect(deleted.ok).toBe(true);

    const reinitialized = await createPersistedApplicationState({ adapter }).initialize();
    expect(reinitialized.ok).toBe(true);
    if (reinitialized.ok) {
      expect(reinitialized.value.documents.settings.revision).toBe(0);
    }
    expect(diagnostics.all()).toHaveLength(0);
  });

  it('recreates defaults after successful deletion', async () => {
    const adapter = createInMemoryKeyValueAdapter();
    const workHistory = createWorkHistoryService(createInMemoryWorkHistoryAdapter());
    const diagnostics = createDiagnosticRingBuffer();
    const service = createDataControlService({ adapter, workHistory, diagnostics });
    const state = createPersistedApplicationState({ adapter });
    await state.initialize();
    await state.commit([
      {
        document: 'settings',
        expectedRevision: 0,
        value: {
          themePreference: 'system',
          workHours: [],
          blockedSites: ['delete.me'],
          hasOnboarded: true,
          quiz: {
            currentQuestionId: 'Q2',
            selectedChoices: [],
            isComplete: true,
            results: null,
          },
        },
      },
    ]);

    const request = service.requestDelete();
    const deleted = await service.deleteAll({
      kind: 'confirm',
      confirmationToken: request.confirmationToken,
    });
    expect(deleted.ok).toBe(true);

    const afterDelete = await state.read('settings');
    expect(afterDelete.ok).toBe(true);
    if (afterDelete.ok) {
      expect(afterDelete.value.revision).toBe(0);
      expect(afterDelete.value.value.hasOnboarded).toBe(false);
      expect(afterDelete.value.value.blockedSites).not.toContain('delete.me');
    }
  });
});
