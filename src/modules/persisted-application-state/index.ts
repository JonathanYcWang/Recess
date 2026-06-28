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

export {
  createPersistedApplicationState,
  persistedOperationalStorageKeys,
} from './persistedApplicationState';
export { settingsCodec, SETTINGS_SCHEMA_VERSION } from './settings/settingsCodec';
export {
  documentRegistry,
  registeredDocumentNames,
  createDefaultDocument,
  createDefaultSettingsValue,
} from './registry/documentRegistry';
export {
  THEME_PREFERENCES,
  type SettingsValue,
  type ThemePreference,
  type WorkHoursEntry,
  type QuizState,
} from './settings/settingsDocument';
export {
  createDataControlService,
  DATA_EXPORT_FORMAT_VERSION,
  type DataControlService,
  type DataExportBundle,
  type DeleteIntent,
} from './dataControl/dataControlService';
export {
  describeSettingsDocumentIntegrationTests,
  describeKeyValueAdapterIntegrationTests,
} from './integration/settingsDocument.integrationTests';
