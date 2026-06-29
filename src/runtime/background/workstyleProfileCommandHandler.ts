import type { PersistedApplicationState, VersionedDocument } from '@/runtime/persistence';
import {
  applyWorkstyleProfileCommand,
  cloneWorkstyleProfileValue,
  type WorkstyleProfileValue,
} from '@/modules/workstyle-profile';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import {
  decodeWorkstyleProfileCommandEnvelope,
  type WorkstyleProfileCommandEnvelope,
  type WorkstyleProfileCommandError,
} from '../protocol/workstyleProfileCommand';
import type { CoinCommandHandler } from '../coinTypes';
import type {
  WorkstyleProfileCommandHandler,
  WorkstyleProfileCommandResponse,
  WorkstyleProfileRuntimeResult,
  WorkstyleProfileSnapshot,
} from '../workstyleProfileTypes';

export const MOOD_BOOST_COIN_COST = 10;

const cloneSnapshot = (snapshot: WorkstyleProfileSnapshot): WorkstyleProfileSnapshot => ({
  ...snapshot,
  value: cloneWorkstyleProfileValue(snapshot.value),
});

const toSuccess = (snapshot: WorkstyleProfileSnapshot): WorkstyleProfileCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: cloneSnapshot(snapshot),
});

const toFailure = (error: WorkstyleProfileCommandError): WorkstyleProfileCommandResponse => ({
  ok: false,
  error,
});

export const createWorkstyleProfileCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<WorkstyleProfileValue>,
  options?: {
    outcomeStore?: CommandOutcomeStore<WorkstyleProfileCommandResponse>;
    coinHandler?: CoinCommandHandler;
    clock?: { nowEpochMs: () => number };
  }
): WorkstyleProfileCommandHandler => {
  let current = cloneSnapshot(initialized);
  const ledger = createCommandLedger<WorkstyleProfileCommandResponse>();
  const outcomeStore = options?.outcomeStore;
  const coinHandler = options?.coinHandler;
  const clock = options?.clock ?? { nowEpochMs: () => Date.now() };
  void coinHandler;
  void clock;
  const listeners = new Set<(snapshot: WorkstyleProfileSnapshot) => void>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('workstyle-profile');
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

  const recordUnexpected = (): WorkstyleProfileCommandResponse =>
    toFailure({ kind: 'unexpected-runtime' });

  const executeFresh = async (
    envelope: WorkstyleProfileCommandEnvelope
  ): Promise<WorkstyleProfileCommandResponse> => {
    if (envelope.expectedRevision !== undefined && envelope.expectedRevision !== current.revision) {
      return toFailure({
        kind: 'stale-revision',
        expectedRevision: envelope.expectedRevision,
        actualRevision: current.revision,
      });
    }
    const decided = applyWorkstyleProfileCommand(current.value, envelope.command);
    if (!decided.ok) {
      return toFailure(decided.error);
    }

    const committed = await persistence.commit([
      {
        document: 'workstyle-profile',
        expectedRevision: current.revision,
        value: decided.value,
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

    const profile = committed.value.documents['workstyle-profile'];
    if (!profile) {
      return toFailure({ kind: 'persistence-failed' });
    }
    current = cloneSnapshot(profile);
    notifyListeners();
    return toSuccess(current);
  };

  return {
    current(): WorkstyleProfileRuntimeResult {
      return { ok: true, value: cloneSnapshot(current) };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async execute(envelopeInput: unknown): Promise<WorkstyleProfileCommandResponse> {
      const decoded = decodeWorkstyleProfileCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('workstyle-profile', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('workstyle-profile', envelope.commandId, response);
        }
        return response;
      } catch {
        const response = recordUnexpected();
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('workstyle-profile', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
