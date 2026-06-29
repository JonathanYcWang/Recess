import type {
  KeyValueStorageAdapter,
  PersistedApplicationState,
  VersionedDocument,
} from '@/runtime/persistence';
import { canonicalizeBlockListInput, type BlockListValue } from '@/modules/block-list';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import {
  decodeBlockListCommandEnvelope,
  type BlockListCommandEnvelope,
  type BlockListCommandError,
} from '../protocol/blockListCommand';
import type {
  BlockListCommandHandler,
  BlockListCommandResponse,
  BlockListRuntimeResult,
  BlockListSnapshot,
} from '../blockListTypes';

const LEGACY_BLOCKED_SITES_KEY = 'blockedSites';

const cloneBlockListValue = (value: BlockListValue): BlockListValue => ({
  entries: [...value.entries],
});

const cloneSnapshot = (snapshot: BlockListSnapshot): BlockListSnapshot => ({
  ...snapshot,
  value: cloneBlockListValue(snapshot.value),
});

const toSuccess = (snapshot: BlockListSnapshot): BlockListCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: cloneSnapshot(snapshot),
});

const toFailure = (error: BlockListCommandError): BlockListCommandResponse => ({
  ok: false,
  error,
});

const migrateLegacyBlockedSites = async (
  adapter: KeyValueStorageAdapter,
  snapshot: BlockListSnapshot
): Promise<BlockListSnapshot> => {
  if (snapshot.revision !== 0 || snapshot.value.entries.length > 0) {
    return snapshot;
  }
  const legacy = await adapter.get(LEGACY_BLOCKED_SITES_KEY);
  if (!legacy.ok || legacy.value === null) {
    return snapshot;
  }
  try {
    const parsed = JSON.parse(legacy.value) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === 'string')) {
      return snapshot;
    }
    const entries: string[] = [];
    for (const entry of parsed) {
      const canonical = canonicalizeBlockListInput(entry);
      if (canonical.ok && !entries.includes(canonical.value)) {
        entries.push(canonical.value);
      }
    }
    if (entries.length === 0) {
      return snapshot;
    }
    return {
      ...snapshot,
      value: { entries },
    };
  } catch {
    return snapshot;
  }
};

export const createBlockListCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<BlockListValue>,
  options?: {
    adapter?: KeyValueStorageAdapter;
    outcomeStore?: CommandOutcomeStore<BlockListCommandResponse>;
  }
): BlockListCommandHandler => {
  let current = cloneSnapshot(initialized);
  const ledger = createCommandLedger<BlockListCommandResponse>();
  const outcomeStore = options?.outcomeStore;
  const listeners = new Set<(snapshot: BlockListSnapshot) => void>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('block-list');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const bootstrap = async (): Promise<void> => {
    if (!options?.adapter) {
      return;
    }
    const migrated = await migrateLegacyBlockedSites(options.adapter, current);
    if (migrated.value.entries.join(',') === current.value.entries.join(',')) {
      return;
    }
    const committed = await persistence.commit([
      {
        document: 'block-list',
        expectedRevision: current.revision,
        value: migrated.value,
      },
    ]);
    if (committed.ok && committed.value.documents['block-list']) {
      current = cloneSnapshot(committed.value.documents['block-list']);
      notifyListeners();
    }
  };
  void bootstrap();

  const notifyListeners = () => {
    const snapshot = cloneSnapshot(current);
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const recordUnexpected = (): BlockListCommandResponse =>
    toFailure({ kind: 'unexpected-runtime' });

  const executeFresh = async (
    envelope: BlockListCommandEnvelope
  ): Promise<BlockListCommandResponse> => {
    if (envelope.expectedRevision !== undefined && envelope.expectedRevision !== current.revision) {
      return toFailure({
        kind: 'stale-revision',
        expectedRevision: envelope.expectedRevision,
        actualRevision: current.revision,
      });
    }

    let nextEntries = [...current.value.entries];

    if (envelope.command.kind === 'add-entry') {
      if (typeof envelope.command.input !== 'string') {
        return toFailure({ kind: 'invalid-entry-input' });
      }
      const canonical = canonicalizeBlockListInput(envelope.command.input);
      if (!canonical.ok) {
        return toFailure({ kind: 'invalid-entry-input' });
      }
      if (nextEntries.includes(canonical.value)) {
        return toFailure({ kind: 'duplicate-entry', hostname: canonical.value });
      }
      nextEntries.push(canonical.value);
    } else {
      if (typeof envelope.command.hostname !== 'string') {
        return toFailure({ kind: 'invalid-entry-input' });
      }
      const canonical = canonicalizeBlockListInput(envelope.command.hostname);
      if (!canonical.ok) {
        return toFailure({ kind: 'invalid-entry-input' });
      }
      if (!nextEntries.includes(canonical.value)) {
        return toFailure({ kind: 'entry-not-found', hostname: canonical.value });
      }
      nextEntries = nextEntries.filter((entry) => entry !== canonical.value);
    }

    const committed = await persistence.commit([
      {
        document: 'block-list',
        expectedRevision: current.revision,
        value: { entries: nextEntries },
      },
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return toFailure({
          kind: 'stale-revision',
          expectedRevision: current.revision,
          actualRevision: committed.error.actualRevision,
        });
      }
      return toFailure({ kind: 'persistence-failed' });
    }

    const blockList = committed.value.documents['block-list'];
    if (!blockList) {
      return toFailure({ kind: 'persistence-failed' });
    }
    current = cloneSnapshot(blockList);
    notifyListeners();
    return toSuccess(current);
  };

  return {
    current(): BlockListRuntimeResult {
      return { ok: true, value: cloneSnapshot(current) };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async execute(envelopeInput: unknown): Promise<BlockListCommandResponse> {
      const decoded = decodeBlockListCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('block-list', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('block-list', envelope.commandId, response);
        }
        return response;
      } catch {
        const response = recordUnexpected();
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('block-list', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
