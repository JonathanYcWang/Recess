import type {
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import { applyCoinCommand, cloneCoinLedgerValue, type CoinLedgerValue } from '@/modules/coin';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import {
  decodeCoinCommandEnvelope,
  type CoinCommandEnvelope,
  type CoinCommandError,
} from '../protocol/coinCommand';
import type {
  CoinCommandHandler,
  CoinCommandResponse,
  CoinRuntimeResult,
  CoinSnapshot,
} from '../coinTypes';

const cloneSnapshot = (snapshot: CoinSnapshot): CoinSnapshot => ({
  ...snapshot,
  value: cloneCoinLedgerValue(snapshot.value),
});

const toSuccess = (snapshot: CoinSnapshot): CoinCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: cloneSnapshot(snapshot),
});

const toFailure = (error: CoinCommandError): CoinCommandResponse => ({
  ok: false,
  error,
});

export const createCoinCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<CoinLedgerValue>,
  options?: {
    diagnostics?: DiagnosticRingBuffer;
    outcomeStore?: CommandOutcomeStore<CoinCommandResponse>;
  }
): CoinCommandHandler => {
  let current = cloneSnapshot(initialized);
  const ledger = createCommandLedger<CoinCommandResponse>();
  const diagnostics = options?.diagnostics;
  const outcomeStore = options?.outcomeStore;
  const listeners = new Set<(snapshot: CoinSnapshot) => void>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('coin');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const notifyListeners = () => {
    const snapshot = cloneSnapshot(current);
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const recordUnexpected = (commandId: string, error: unknown): CoinCommandResponse => {
    const message = error instanceof Error ? error.message : 'unexpected runtime failure';
    const record = diagnostics?.record({
      category: 'unexpected-runtime',
      message,
      context: { commandId, module: 'coin' },
    });
    return toFailure({
      kind: 'unexpected-runtime',
      diagnosticId: record?.id ?? 'diag-unavailable',
    });
  };

  const executeFresh = async (envelope: CoinCommandEnvelope): Promise<CoinCommandResponse> => {
    if (envelope.expectedRevision !== undefined && envelope.expectedRevision !== current.revision) {
      return toFailure({
        kind: 'stale-revision',
        expectedRevision: envelope.expectedRevision,
        actualRevision: current.revision,
      });
    }

    const decided = applyCoinCommand(current.value, envelope.command);
    if (!decided.ok) {
      return toFailure(decided.error);
    }
    if (decided.value.kind === 'duplicate') {
      return toSuccess({ ...current, value: decided.value.ledger });
    }

    const committed = await persistence.commit([
      {
        document: 'coin',
        expectedRevision: current.revision,
        value: decided.value.ledger,
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

    const coin = committed.value.documents.coin;
    if (!coin) {
      return toFailure({ kind: 'persistence-failed' });
    }
    current = cloneSnapshot(coin);
    notifyListeners();
    return toSuccess(current);
  };

  return {
    current(): CoinRuntimeResult {
      return { ok: true, value: cloneSnapshot(current) };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async execute(envelopeInput: unknown): Promise<CoinCommandResponse> {
      const decoded = decodeCoinCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('coin', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('coin', envelope.commandId, response);
        }
        return response;
      } catch (error) {
        const response = recordUnexpected(envelope.commandId, error);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('coin', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
