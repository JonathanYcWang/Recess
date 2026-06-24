import type {
  PersistedApplicationState,
  SettingsValue,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { createCommandLedger } from '../commandLedger';
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
  options?: { diagnostics?: DiagnosticRingBuffer }
): SettingsCommandHandler => {
  let current = cloneSnapshot(initialized);
  const ledger = createCommandLedger<SettingsCommandResponse>();
  const diagnostics = options?.diagnostics;

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
    return toSuccess(current);
  };

  return {
    current(): SettingsRuntimeResult {
      return { ok: true, value: cloneSnapshot(current) };
    },

    async execute(envelopeInput): Promise<SettingsCommandResponse> {
      const decoded = decodeSettingsCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        return response;
      } catch (error) {
        const response = recordUnexpected(envelope.commandId, error);
        ledger.set(envelope.commandId, response);
        return response;
      }
    },
  };
};
