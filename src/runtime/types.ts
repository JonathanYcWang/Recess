import type {
  SettingsValue,
  ThemePreference,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import type { SettingsCommandEnvelope, SettingsCommandError } from './protocol/settingsCommand';
import type { SettingsRuntimeTransportError } from './messaging/messages';
import type { RuntimeCommandResponse } from './protocol/types';

export type SettingsSnapshot = VersionedDocument<SettingsValue>;

export type SettingsCommandResponse = RuntimeCommandResponse<
  SettingsSnapshot,
  SettingsCommandError
>;

export type SettingsClientError = SettingsCommandError | SettingsRuntimeTransportError;

export type SettingsClientCommandResult = RuntimeCommandResponse<
  SettingsSnapshot,
  SettingsClientError
>;

export type SettingsClientCurrentResult =
  | SettingsRuntimeResult
  | { ok: false; error: SettingsRuntimeTransportError };

export type SettingsRuntimeError = SettingsCommandError;

export type SettingsRuntimeResult =
  | { ok: true; value: SettingsSnapshot }
  | { ok: false; error: SettingsRuntimeError };

export interface SettingsSubscribeOptions {
  onTransportLoss?: () => void;
}

export interface SettingsCommandHandler {
  current(): SettingsRuntimeResult;
  execute(envelope: unknown): Promise<SettingsCommandResponse>;
  subscribe(listener: (snapshot: SettingsSnapshot) => void): () => void;
}

export interface SettingsClient {
  current(): Promise<SettingsClientCurrentResult>;
  command(envelope: SettingsCommandEnvelope): Promise<SettingsClientCommandResult>;
  setThemePreference(
    preference: ThemePreference,
    options?: { commandId?: string; expectedRevision?: number }
  ): Promise<SettingsClientCommandResult>;
  subscribe(
    listener: (snapshot: SettingsSnapshot) => void,
    options?: SettingsSubscribeOptions
  ): () => void;
}
