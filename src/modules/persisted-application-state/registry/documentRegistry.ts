import type {
  DocumentCodec,
  PersistedDocumentName,
  PersistedDocuments,
  VersionedDocument,
} from '../types';
import { settingsCodec } from '../settings/settingsCodec';
import type { SettingsValue } from '../settings/settingsDocument';
import { createDefaultSettingsValue } from '../settings/settingsDocument';

export const SETTINGS_DOCUMENT_KEY = '__recess_doc_settings';

export interface DocumentRegistryEntry<T> {
  document: PersistedDocumentName;
  storageKey: string;
  codec: DocumentCodec<T>;
  createDefault: () => VersionedDocument<T>;
}

export const documentRegistry = {
  settings: {
    document: 'settings',
    storageKey: SETTINGS_DOCUMENT_KEY,
    codec: settingsCodec,
    createDefault: () => settingsCodec.createDefault(),
  },
} as const satisfies {
  settings: DocumentRegistryEntry<SettingsValue>;
};

export const registeredDocumentNames = [
  'settings',
] as const satisfies readonly PersistedDocumentName[];

export const allOperationalStorageKeys = (): string[] =>
  registeredDocumentNames.map((name) => documentRegistry[name].storageKey);

export const createDefaultDocument = <K extends PersistedDocumentName>(
  name: K
): VersionedDocument<PersistedDocuments[K]> => documentRegistry[name].createDefault();

export { createDefaultSettingsValue };
