import type {
  PersistedApplicationState,
  SettingsValue,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import { decodeSettingsCommandEnvelope, type SettingsCommandError } from '../protocol/settingsCommand';
import type {
  SettingsCommandHandler,
  SettingsCommandResponse,
  SettingsRuntimeResult,
  SettingsSnapshot,
} from '../types';

const cloneSettingsValue = (value: SettingsValue): SettingsValue => ({
  workHours: value.workHours.map((entry) => ({
    ...entry,
    days: [...entry.days],
  })),
  blockedSites: [...value.blockedSites],
  hasOnboarded: value.hasOnboarded,
  windDownSoundEnabled: value.windDownSoundEnabled,
  quiz: {
    ...value.quiz,
    selectedChoices: value.quiz.selectedChoices.map((choice) => ({ ...choice })),
    results: value.quiz.results ? { ...value.quiz.results } : null,
  },
});

const cloneSnapshot = (snapshot: SettingsSnapshot): SettingsSnapshot => ({
  ...snapshot,
  value: cloneSettingsValue(snapshot.value),
});

const toFailure = (error: SettingsCommandError): SettingsCommandResponse => ({
  ok: false,
  error,
});

export const createSettingsCommandHandler = (
  _persistence: PersistedApplicationState,
  initialized: VersionedDocument<SettingsValue>,
  options?: {
    diagnostics?: DiagnosticRingBuffer;
    outcomeStore?: CommandOutcomeStore<SettingsCommandResponse>;
  }
): SettingsCommandHandler => {
  const current = cloneSnapshot(initialized);
  const ledger = createCommandLedger<SettingsCommandResponse>();
  const diagnostics = options?.diagnostics;
  const outcomeStore = options?.outcomeStore;
  const listeners = new Set<(snapshot: SettingsSnapshot) => void>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('settings');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const recordUnexpected = (commandId: string, error: unknown): SettingsCommandResponse => {
    const message = error instanceof Error ? error.message : 'unexpected runtime failure';
    const record = diagnostics?.record({
      category: 'unexpected-runtime',
      message,
      context: { commandId, module: 'settings' },
    });
    return toFailure({
      kind: 'unexpected-runtime',
      diagnosticId: record?.id ?? 'diag-unavailable',
    });
  };

  return {
    current(): SettingsRuntimeResult {
      return { ok: true, value: cloneSnapshot(current) };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async execute(envelopeInput: unknown): Promise<SettingsCommandResponse> {
      const decoded = decodeSettingsCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }

      const envelope = decoded.value;
      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('settings', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = toFailure({
          kind: 'malformed-command',
          message: 'unsupported Settings command kind',
        });
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('settings', envelope.commandId, response);
        }
        return response;
      } catch (error) {
        const response = recordUnexpected(envelope.commandId, error);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('settings', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
