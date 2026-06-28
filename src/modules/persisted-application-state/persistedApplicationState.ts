import {
  documentRegistry,
  registeredDocumentNames,
  type DocumentRegistryEntry,
} from './registry/documentRegistry';
import type {
  CommitError,
  CommitResult,
  HydrationSnapshot,
  KeyValueStorageAdapter,
  PersistedApplicationState,
  PersistedChangeListener,
  PersistedDocumentName,
  PersistedDocuments,
  Result,
  StorageError,
  VersionedDocument,
} from './types';
export interface PersistedApplicationStateOptions {
  adapter: KeyValueStorageAdapter;
}
let commitChain: Promise<unknown> = Promise.resolve();
const runSerialized = <T>(task: () => Promise<T>): Promise<T> => {
  const next = commitChain.then(task, task);
  commitChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
};
const readDocument = async <T>(
  adapter: KeyValueStorageAdapter,
  entry: DocumentRegistryEntry<T>
): Promise<Result<VersionedDocument<T>, StorageError | import('./types').CodecError>> => {
  const stored = await adapter.get(entry.storageKey);
  if (!stored.ok) {
    return stored;
  }
  if (stored.value === null) {
    return { ok: true, value: entry.createDefault() };
  }
  try {
    return entry.codec.decode(JSON.parse(stored.value));
  } catch {
    return {
      ok: false,
      error: {
        kind: 'invalid-document',
        message: `Stored ${entry.document} document is not valid JSON`,
      },
    };
  }
};
const writeDocument = async <T>(
  adapter: KeyValueStorageAdapter,
  entry: DocumentRegistryEntry<T>,
  document: VersionedDocument<T>,
  expectedRevision: number
): Promise<Result<VersionedDocument<T>, CommitError>> => {
  const current = await readDocument(adapter, entry);
  if (!current.ok) {
    if ('message' in current.error) {
      return { ok: false, error: { kind: 'codec', error: current.error } };
    }
    return { ok: false, error: { kind: 'storage', error: current.error } };
  }
  if (current.value.revision !== expectedRevision) {
    return {
      ok: false,
      error: {
        kind: 'conflict',
        expectedRevision,
        actualRevision: current.value.revision,
      },
    };
  }
  const nextDocument: VersionedDocument<T> = {
    ...document,
    schemaVersion: entry.codec.schemaVersion,
    revision: expectedRevision + 1,
  };
  const encodedDocument = entry.codec.encode(nextDocument);
  const documentWrite = await adapter.set(entry.storageKey, JSON.stringify(encodedDocument));
  if (!documentWrite.ok) {
    return { ok: false, error: { kind: 'storage', error: documentWrite.error } };
  }
  return { ok: true, value: nextDocument };
};
export const createPersistedApplicationState = (
  options: PersistedApplicationStateOptions
): PersistedApplicationState => {
  const { adapter } = options;
  const listeners = new Map<PersistedDocumentName, Set<PersistedChangeListener>>();
  const notify = (documents: Partial<HydrationSnapshot['documents']>) => {
    for (const key of Object.keys(documents) as PersistedDocumentName[]) {
      const document = documents[key];
      if (!document) {
        continue;
      }
      const keyListeners = listeners.get(key);
      if (!keyListeners) {
        continue;
      }
      for (const listener of keyListeners) {
        listener({ [key]: document });
      }
    }
  };
  const loadDocumentWithRecovery = async <K extends PersistedDocumentName>(
    name: K
  ): Promise<VersionedDocument<PersistedDocuments[K]>> => {
    const entry = documentRegistry[name] as DocumentRegistryEntry<PersistedDocuments[K]>;
    const loaded = await readDocument(adapter, entry);
    if (loaded.ok) {
      return loaded.value;
    }
    const defaulted = entry.createDefault();
    await adapter.set(entry.storageKey, JSON.stringify(entry.codec.encode(defaulted)));
    return defaulted;
  };
  return {
    async initialize(): Promise<Result<HydrationSnapshot, StorageError>> {
      const documents = {} as HydrationSnapshot['documents'];
      for (const name of registeredDocumentNames) {
        (
          documents as Record<
            PersistedDocumentName,
            VersionedDocument<PersistedDocuments[PersistedDocumentName]>
          >
        )[name] = await loadDocumentWithRecovery(name);
      }
      return { ok: true, value: { documents } };
    },
    async read(key) {
      const entry = documentRegistry[key] as DocumentRegistryEntry<PersistedDocuments[typeof key]>;
      return readDocument(adapter, entry);
    },
    commit(mutations) {
      return runSerialized(async () => {
        const result: CommitResult['documents'] = {};
        for (const mutation of mutations) {
          const entry = documentRegistry[mutation.document] as DocumentRegistryEntry<
            PersistedDocuments[typeof mutation.document]
          >;
          const current = await readDocument(adapter, entry);
          if (!current.ok) {
            return { ok: false, error: { kind: 'codec', error: current.error } } as Result<
              CommitResult,
              CommitError
            >;
          }
          const nextValue = {
            ...current.value,
            value: mutation.value,
          };
          const committed = await writeDocument(
            adapter,
            entry,
            nextValue,
            mutation.expectedRevision
          );
          if (!committed.ok) {
            return committed as Result<CommitResult, CommitError>;
          }
          (
            result as Record<
              PersistedDocumentName,
              VersionedDocument<PersistedDocuments[PersistedDocumentName]> | undefined
            >
          )[mutation.document] = committed.value;
        }
        notify(result);
        return { ok: true, value: { documents: result } };
      });
    },
    observe(keys, listener) {
      for (const key of keys) {
        if (!listeners.has(key)) {
          listeners.set(key, new Set());
        }
        listeners.get(key)?.add(listener);
      }
      return () => {
        for (const key of keys) {
          listeners.get(key)?.delete(listener);
        }
      };
    },
  };
};
export const persistedOperationalStorageKeys = (): string[] => [
  ...registeredDocumentNames.map((name) => documentRegistry[name].storageKey),
];
