import type {
  SettingsValue,
  ThemePreference,
  VersionedDocument,
} from '@/modules/persisted-application-state';

export type SettingsSnapshot = VersionedDocument<SettingsValue>;

type SettingsIntent = {
  kind: 'set-theme-preference';
  preference: unknown;
};

export type SettingsRuntimeError =
  | { kind: 'invalid-theme-preference' }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' };

export type SettingsRuntimeResult =
  | { ok: true; value: SettingsSnapshot }
  | { ok: false; error: SettingsRuntimeError };

export interface SettingsCommandHandler {
  current(): SettingsRuntimeResult;
  dispatch(intent: SettingsIntent): Promise<SettingsRuntimeResult>;
}

export interface SettingsClient {
  current(): Promise<SettingsRuntimeResult>;
  setThemePreference(preference: ThemePreference): Promise<SettingsRuntimeResult>;
}
