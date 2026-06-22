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
import { settingsCodec } from './settings/settingsCodec';

const SETTINGS_DOCUMENT_KEY = '__recess_doc_settings';

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

const readSettings = async (
  adapter: KeyValueStorageAdapter
): Promise<
  Result<
    VersionedDocument<PersistedDocuments['settings']>,
    StorageError | import('./types').CodecError
  >
> => {
  const stored = await adapter.get(SETTINGS_DOCUMENT_KEY);
  if (!stored.ok) {
    return stored;
  }
  if (stored.value === null) {
    return { ok: true, value: settingsCodec.createDefault() };
  }
  try {
    return settingsCodec.decode(JSON.parse(stored.value));
  } catch {
    return {
      ok: false,
      error: {
        kind: 'invalid-document',
        message: 'Stored Settings document is not valid JSON',
      },
    };
  }
};

const writeSettings = async (
  adapter: KeyValueStorageAdapter,
  document: VersionedDocument<PersistedDocuments['settings']>,
  expectedRevision: number
): Promise<Result<VersionedDocument<PersistedDocuments['settings']>, CommitError>> => {
  const current = await readSettings(adapter);
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

  const nextDocument: VersionedDocument<PersistedDocuments['settings']> = {
    schemaVersion: settingsCodec.schemaVersion,
    revision: expectedRevision + 1,
    value: document.value,
  };
  const encoded = JSON.stringify(settingsCodec.encode(nextDocument));
  const write = await adapter.set(SETTINGS_DOCUMENT_KEY, encoded);
  if (!write.ok) {
    return { ok: false, error: { kind: 'storage', error: write.error } };
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

  return {
    async initialize(): Promise<Result<HydrationSnapshot, StorageError>> {
      const loaded = await readSettings(adapter);
      if (loaded.ok) {
        return { ok: true, value: { documents: { settings: loaded.value } } };
      }
      const defaulted = settingsCodec.createDefault();
      const write = await adapter.set(
        SETTINGS_DOCUMENT_KEY,
        JSON.stringify(settingsCodec.encode(defaulted))
      );
      if (!write.ok) {
        return write;
      }
      return { ok: true, value: { documents: { settings: defaulted } } };
    },

    async read(key) {
      if (key !== 'settings') {
        return {
          ok: false,
          error: {
            kind: 'invalid-document',
            message: `Unknown document ${key}`,
          },
        };
      }
      return readSettings(adapter);
    },

    commit(mutations) {
      return runSerialized(async () => {
        const result: CommitResult['documents'] = {};
        for (const mutation of mutations) {
          if (mutation.document !== 'settings') {
            return {
              ok: false,
              error: {
                kind: 'codec',
                error: {
                  kind: 'invalid-document',
                  message: `Unknown document ${mutation.document}`,
                },
              },
            } as Result<CommitResult, CommitError>;
          }
          const committed = await writeSettings(
            adapter,
            {
              schemaVersion: settingsCodec.schemaVersion,
              revision: mutation.expectedRevision,
              value: mutation.value,
            },
            mutation.expectedRevision
          );
          if (!committed.ok) {
            return committed as Result<CommitResult, CommitError>;
          }
          result.settings = committed.value;
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
