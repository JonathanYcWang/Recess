export type {
  CommitError,
  CommitResult,
  DocumentCodec,
  HydrationSnapshot,
  KeyValueStorageAdapter,
  PersistedApplicationState,
  PersistedChangeListener,
  PersistedDocumentName,
  PersistedMutation,
  Result,
  StorageError,
  VersionedDocument,
} from './types';

export { createPersistedApplicationState } from './persistedApplicationState';
export { settingsCodec, SETTINGS_SCHEMA_VERSION } from './settings/settingsCodec';
export {
  createDefaultSettingsValue,
  type SettingsValue,
  type WorkHoursEntry,
  type QuizState,
} from './settings/settingsDocument';
export {
  describeSettingsDocumentIntegrationTests,
  describeKeyValueAdapterIntegrationTests,
} from './integration/settingsDocument.integrationTests';
