import {
  createDiagnosticRingBuffer,
  createPersistedApplicationState,
  type KeyValueStorageAdapter,
} from '@/modules/persisted-application-state';
import { createInProcessSettingsClient } from '../client/inProcessSettingsClient';
import { createCommandOutcomeStore } from '../commandOutcomeStore';
import type { SettingsClient, SettingsCommandHandler, SettingsRuntimeError } from '../types';
import { createSettingsCommandHandler } from './settingsCommandHandler';

export interface BackgroundCompositionRoot {
  settings: SettingsClient;
  handler: SettingsCommandHandler;
}

type BackgroundCompositionRootResult =
  | { ok: true; value: BackgroundCompositionRoot }
  | { ok: false; error: SettingsRuntimeError };

export const createBackgroundCompositionRoot = async (options: {
  adapter: KeyValueStorageAdapter;
}): Promise<BackgroundCompositionRootResult> => {
  const diagnostics = createDiagnosticRingBuffer();
  const persistence = createPersistedApplicationState({ adapter: options.adapter, diagnostics });
  const initialized = await persistence.initialize();
  if (!initialized.ok) {
    return { ok: false, error: { kind: 'persistence-unavailable' } };
  }

  const settingsHandler = createSettingsCommandHandler(
    persistence,
    initialized.value.documents.settings,
    { diagnostics, outcomeStore: createCommandOutcomeStore(options.adapter) }
  );

  return {
    ok: true,
    value: {
      settings: createInProcessSettingsClient(settingsHandler),
      handler: settingsHandler,
    },
  };
};
