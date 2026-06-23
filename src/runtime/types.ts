import type {
  SettingsValue,
  ThemePreference,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import type {
  SettingsCommandEnvelope,
  SettingsCommandError,
} from './protocol/settingsCommand';
import type { RuntimeCommandResponse } from './protocol/types';

export type SettingsSnapshot = VersionedDocument<SettingsValue>;

export type SettingsCommandResponse = RuntimeCommandResponse<
  SettingsSnapshot,
  SettingsCommandError
>;

export type SettingsRuntimeError = SettingsCommandError;

export type SettingsRuntimeResult =
  | { ok: true; value: SettingsSnapshot }
  | { ok: false; error: SettingsRuntimeError };

export interface SettingsCommandHandler {
  current(): SettingsRuntimeResult;
  execute(envelope: SettingsCommandEnvelope): Promise<SettingsCommandResponse>;
}

export interface SettingsClient {
  current(): Promise<SettingsRuntimeResult>;
  command(envelope: SettingsCommandEnvelope): Promise<SettingsCommandResponse>;
  setThemePreference(
    preference: ThemePreference,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<SettingsCommandResponse>;
}
