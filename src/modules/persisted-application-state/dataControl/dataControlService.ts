import type { DiagnosticRingBuffer, DiagnosticRecord } from '../diagnostics/diagnosticRingBuffer';
import {
  createPersistedApplicationState,
  persistedOperationalStorageKeys,
} from '../persistedApplicationState';
import type { KeyValueStorageAdapter, Result, StorageError } from '../types';
import type { WorkHistoryService } from '@/modules/work-history/types';

export const DATA_EXPORT_FORMAT_VERSION = 1;

export interface DataExportBundle {
  formatVersion: number;
  exportedAt: number;
  operationalDocuments: Record<string, unknown>;
  workHistory: readonly import('@/modules/work-history/types').WorkHistoryFact[];
  diagnostics: readonly DiagnosticRecord[];
}

export type DeleteIntent = { kind: 'request' } | { kind: 'confirm'; confirmationToken: string };

export type DataControlError =
  | { kind: 'invalid-token' }
  | { kind: 'partial-failure'; failures: string[] }
  | { kind: 'storage'; error: StorageError };

export interface DeleteRequest {
  confirmationToken: string;
}

export interface DataControlService {
  requestDelete(): DeleteRequest;
  export(): Promise<Result<DataExportBundle, StorageError>>;
  deleteAll(intent: DeleteIntent): Promise<Result<void, DataControlError>>;
}

export interface DataControlServiceOptions {
  adapter: KeyValueStorageAdapter;
  workHistory: WorkHistoryService;
  diagnostics: DiagnosticRingBuffer;
  pendingTemporaryKeys?: readonly string[];
}

export const createDataControlService = (
  options: DataControlServiceOptions
): DataControlService => {
  const { adapter, workHistory, diagnostics, pendingTemporaryKeys = [] } = options;
  const persistedState = createPersistedApplicationState({ adapter, diagnostics });
  let pendingDeleteToken: string | null = null;

  return {
    requestDelete() {
      pendingDeleteToken = `delete-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      return { confirmationToken: pendingDeleteToken };
    },

    async export() {
      const initialized = await persistedState.initialize();
      if (!initialized.ok) {
        return initialized;
      }
      const history = await workHistory.query();
      if (!history.ok) {
        return {
          ok: false,
          error: { kind: 'read-failed', cause: history.error },
        };
      }
      const operationalDocuments: Record<string, unknown> = {};
      for (const [name, document] of Object.entries(initialized.value.documents)) {
        operationalDocuments[name] = document;
      }
      return {
        ok: true,
        value: {
          formatVersion: DATA_EXPORT_FORMAT_VERSION,
          exportedAt: Date.now(),
          operationalDocuments,
          workHistory: history.value,
          diagnostics: diagnostics.all(),
        },
      };
    },

    async deleteAll(intent) {
      if (intent.kind === 'request') {
        return { ok: false, error: { kind: 'invalid-token' } };
      }
      if (pendingDeleteToken === null || intent.confirmationToken !== pendingDeleteToken) {
        return { ok: false, error: { kind: 'invalid-token' } };
      }

      const failures: string[] = [];
      const keys = [...persistedOperationalStorageKeys(), ...pendingTemporaryKeys];
      if (adapter.removeAll) {
        const removed = await adapter.removeAll(keys);
        if (!removed.ok) {
          failures.push('operational-storage');
        }
      } else {
        for (const key of keys) {
          const removed = await adapter.remove(key);
          if (!removed.ok) {
            failures.push(key);
          }
        }
      }

      const historyClear = await workHistory.clear();
      if (!historyClear.ok) {
        failures.push('work-history');
      }

      diagnostics.clear();
      pendingDeleteToken = null;

      const reinitialized = await persistedState.initialize();
      if (!reinitialized.ok) {
        failures.push('reinitialize');
      }

      if (failures.length > 0) {
        return { ok: false, error: { kind: 'partial-failure', failures } };
      }
      return { ok: true, value: undefined };
    },
  };
};
