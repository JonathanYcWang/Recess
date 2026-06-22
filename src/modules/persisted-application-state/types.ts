export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface VersionedDocument<T> {
  schemaVersion: number;
  revision: number;
  value: T;
}

export type CodecError = {
  kind: 'invalid-document' | 'unsupported-version' | 'invalid-field';
  message: string;
  field?: string;
};

export interface DocumentCodec<T> {
  readonly schemaVersion: number;
  decode(wire: unknown): Result<VersionedDocument<T>, CodecError>;
  encode(document: VersionedDocument<T>): unknown;
  createDefault(): VersionedDocument<T>;
}

export type StorageError =
  | { kind: 'unavailable' }
  | { kind: 'quota-exceeded' }
  | { kind: 'read-failed'; cause?: unknown }
  | { kind: 'write-failed'; cause?: unknown };

export interface KeyValueStorageAdapter {
  get(key: string): Promise<Result<string | null, StorageError>>;
  set(key: string, value: string): Promise<Result<void, StorageError>>;
  remove(key: string): Promise<Result<void, StorageError>>;
  removeAll?(keys: readonly string[]): Promise<Result<void, StorageError>>;
}

export type CommitError =
  | { kind: 'conflict'; expectedRevision: number; actualRevision: number }
  | { kind: 'storage'; error: StorageError }
  | { kind: 'codec'; error: CodecError }
  | { kind: 'serialization'; message: string };

export type PersistedDocumentName = 'settings';

export interface PersistedDocuments {
  settings: import('./settings/settingsDocument').SettingsValue;
}

export type PersistedMutation<K extends PersistedDocumentName = PersistedDocumentName> = {
  document: K;
  expectedRevision: number;
  value: PersistedDocuments[K];
};

export type CommitResult = {
  documents: { [K in PersistedDocumentName]?: VersionedDocument<PersistedDocuments[K]> };
};

export interface HydrationSnapshot {
  documents: {
    [K in PersistedDocumentName]: VersionedDocument<PersistedDocuments[K]>;
  };
}

export type PersistedChangeListener = (
  documents: Partial<{ [K in PersistedDocumentName]: VersionedDocument<PersistedDocuments[K]> }>
) => void;

export interface PersistedApplicationState {
  initialize(): Promise<Result<HydrationSnapshot, StorageError>>;
  read<K extends PersistedDocumentName>(
    key: K
  ): Promise<Result<VersionedDocument<PersistedDocuments[K]>, StorageError | CodecError>>;
  commit(mutations: readonly PersistedMutation[]): Promise<Result<CommitResult, CommitError>>;
  observe(keys: readonly PersistedDocumentName[], listener: PersistedChangeListener): () => void;
}
