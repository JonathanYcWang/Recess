import type {
  DocumentCodec,
  PersistedDocumentName,
  PersistedDocuments,
  VersionedDocument,
} from '../types';
import { blockListCodec } from '@/modules/block-list';
import { settingsCodec } from '../settings/settingsCodec';
import type { SettingsValue } from '../settings/settingsDocument';
import { createDefaultSettingsValue } from '../settings/settingsDocument';
import type { BlockListValue } from '@/modules/block-list';

export const SETTINGS_DOCUMENT_KEY = '__recess_doc_settings';
export const BLOCK_LIST_DOCUMENT_KEY = '__recess_doc_block_list';

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
  'block-list': {
    document: 'block-list',
    storageKey: BLOCK_LIST_DOCUMENT_KEY,
    codec: blockListCodec,
    createDefault: () => blockListCodec.createDefault(),
  },
} as const satisfies {
  settings: DocumentRegistryEntry<SettingsValue>;
  'block-list': DocumentRegistryEntry<BlockListValue>;
};

export const registeredDocumentNames = [
  'settings',
  'block-list',
] as const satisfies readonly PersistedDocumentName[];

export const allOperationalStorageKeys = (): string[] =>
  registeredDocumentNames.map((name) => documentRegistry[name].storageKey);

export const createDefaultDocument = <K extends PersistedDocumentName>(
  name: K
): VersionedDocument<PersistedDocuments[K]> =>
  documentRegistry[name].createDefault() as VersionedDocument<PersistedDocuments[K]>;

export { createDefaultSettingsValue };
