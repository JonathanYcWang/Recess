import type { DocumentCodec, KeyValueStorageAdapter, Result, VersionedDocument } from '../types';

export const JOURNAL_STORAGE_KEY = '__recess_transaction_journal';

export type JournalPhase = 'pending-document-write' | 'pending-journal-clear';

export interface JournalEntry {
  transactionId: string;
  documentKey: string;
  expectedRevision: number;
  nextRevision: number;
  encodedDocument: unknown;
  phase: JournalPhase;
}

export type JournalHooks = {
  afterJournalWrite?: () => void;
  afterDocumentWrite?: () => void;
  beforeJournalClear?: () => void;
};

const parseJournalEntry = (wire: unknown): Result<JournalEntry, string> => {
  if (typeof wire !== 'object' || wire === null) {
    return { ok: false, error: 'journal entry must be an object' };
  }
  const entry = wire as Record<string, unknown>;
  if (typeof entry.transactionId !== 'string') {
    return { ok: false, error: 'journal transactionId must be a string' };
  }
  if (typeof entry.documentKey !== 'string') {
    return { ok: false, error: 'journal documentKey must be a string' };
  }
  if (typeof entry.expectedRevision !== 'number') {
    return { ok: false, error: 'journal expectedRevision must be a number' };
  }
  if (typeof entry.nextRevision !== 'number') {
    return { ok: false, error: 'journal nextRevision must be a number' };
  }
  if (entry.phase !== 'pending-document-write' && entry.phase !== 'pending-journal-clear') {
    return { ok: false, error: 'journal phase is invalid' };
  }
  return {
    ok: true,
    value: {
      transactionId: entry.transactionId as string,
      documentKey: entry.documentKey as string,
      expectedRevision: entry.expectedRevision as number,
      nextRevision: entry.nextRevision as number,
      encodedDocument: entry.encodedDocument,
      phase: entry.phase as JournalPhase,
    },
  };
};

export const readJournalEntry = async (
  adapter: KeyValueStorageAdapter
): Promise<Result<JournalEntry | null, never>> => {
  const stored = await adapter.get(JOURNAL_STORAGE_KEY);
  if (!stored.ok) {
    return { ok: true, value: null };
  }
  if (stored.value === null) {
    return { ok: true, value: null };
  }
  try {
    const parsed = parseJournalEntry(JSON.parse(stored.value));
    if (!parsed.ok) {
      return { ok: true, value: null };
    }
    return { ok: true, value: parsed.value };
  } catch {
    return { ok: true, value: null };
  }
};

export const writeJournalEntry = async (
  adapter: KeyValueStorageAdapter,
  entry: JournalEntry,
  hooks?: JournalHooks
): Promise<Result<void, import('../types').StorageError>> => {
  const write = await adapter.set(JOURNAL_STORAGE_KEY, JSON.stringify(entry));
  if (!write.ok) {
    return write;
  }
  hooks?.afterJournalWrite?.();
  return { ok: true, value: undefined };
};

export const clearJournalEntry = async (
  adapter: KeyValueStorageAdapter,
  hooks?: JournalHooks
): Promise<Result<void, import('../types').StorageError>> => {
  hooks?.beforeJournalClear?.();
  return adapter.remove(JOURNAL_STORAGE_KEY);
};

export const rollForwardJournal = async <T>(
  adapter: KeyValueStorageAdapter,
  codec: DocumentCodec<T>,
  hooks?: JournalHooks
): Promise<Result<VersionedDocument<T> | null, never>> => {
  const journal = await readJournalEntry(adapter);
  if (!journal.ok || journal.value === null) {
    return { ok: true, value: null };
  }

  const entry = journal.value;
  if (entry.phase === 'pending-document-write') {
    const write = await adapter.set(entry.documentKey, JSON.stringify(entry.encodedDocument));
    if (!write.ok) {
      return { ok: true, value: null };
    }
    hooks?.afterDocumentWrite?.();
    const nextEntry: JournalEntry = { ...entry, phase: 'pending-journal-clear' };
    const journalWrite = await writeJournalEntry(adapter, nextEntry, hooks);
    if (!journalWrite.ok) {
      return { ok: true, value: null };
    }
  }

  const refreshed = await readJournalEntry(adapter);
  if (!refreshed.ok || refreshed.value === null) {
    return { ok: true, value: null };
  }
  if (refreshed.value.phase === 'pending-journal-clear') {
    const decoded = codec.decode(refreshed.value.encodedDocument);
    if (!decoded.ok) {
      await clearJournalEntry(adapter, hooks);
      return { ok: true, value: null };
    }
    await clearJournalEntry(adapter, hooks);
    return { ok: true, value: decoded.value };
  }

  return { ok: true, value: null };
};
