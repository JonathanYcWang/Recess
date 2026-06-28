import type {
  PersistedApplicationState,
  SettingsValue,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import type { EffectExecutor } from '../effects/effectExecutor';
import { runSettingsEffectTransition } from '../effects/settingsEffectTransition';
import {
  decodeSettingsCommandEnvelope,
  isThemePreference,
  type SettingsCommandEnvelope,
  type SettingsCommandError,
} from '../protocol/settingsCommand';
import type {
  SettingsCommandHandler,
  SettingsCommandResponse,
  SettingsRuntimeResult,
  SettingsSnapshot,
} from '../types';

const cloneSettingsValue = (value: SettingsValue): SettingsValue => ({
  themePreference: value.themePreference,
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

const toSuccess = (snapshot: SettingsSnapshot): SettingsCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: cloneSnapshot(snapshot),
});

const toFailure = (error: SettingsCommandError): SettingsCommandResponse => ({
  ok: false,
  error,
});

export const createSettingsCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<SettingsValue>,
  options?: {
    effectExecutor?: EffectExecutor;
    outcomeStore?: CommandOutcomeStore<SettingsCommandResponse>;
  }
): SettingsCommandHandler => {
  let current = cloneSnapshot(initialized);
  const ledger = createCommandLedger<SettingsCommandResponse>();
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

  const notifyListeners = () => {
    const snapshot = cloneSnapshot(current);
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const recordUnexpected = (): SettingsCommandResponse => toFailure({ kind: 'unexpected-runtime' });

  const executeFresh = async (
    envelope: SettingsCommandEnvelope
  ): Promise<SettingsCommandResponse> => {
    if (envelope.expectedRevision !== undefined && envelope.expectedRevision !== current.revision) {
      return toFailure({
        kind: 'stale-revision',
        expectedRevision: envelope.expectedRevision,
        actualRevision: current.revision,
      });
    }

    if (!isThemePreference(envelope.command.preference)) {
      return toFailure({ kind: 'invalid-theme-preference' });
    }

    const committed = await persistence.commit([
      {
        document: 'settings',
        expectedRevision: current.revision,
        value: {
          ...current.value,
          themePreference: envelope.command.preference,
        },
      },
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return toFailure({
          kind: 'stale-revision',
          expectedRevision: current.revision,
          actualRevision: committed.error.actualRevision,
        });
      }
      return toFailure({ kind: 'persistence-failed' });
    }

    const settings = committed.value.documents.settings;
    if (!settings) {
      return toFailure({ kind: 'persistence-failed' });
    }
    current = cloneSnapshot(settings);
    notifyListeners();
    const response = toSuccess(current);
    if (!options?.effectExecutor) {
      return response;
    }
    return runSettingsEffectTransition({
      executor: options.effectExecutor,
      commandId: envelope.commandId,
      preference: envelope.command.preference,
      outcomeRevision: current.revision,
      response,
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
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('settings', envelope.commandId, response);
        }
        return response;
      } catch {
        const response = recordUnexpected();
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('settings', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
