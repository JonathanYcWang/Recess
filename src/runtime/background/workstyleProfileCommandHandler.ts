import type {
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  applyWorkstyleProfileCommand,
  cloneWorkstyleProfileValue,
  type WorkstyleProfileValue,
} from '@/modules/workstyle-profile';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
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
    diagnostics?: DiagnosticRingBuffer;
    outcomeStore?: CommandOutcomeStore<WorkstyleProfileCommandResponse>;
    coinHandler?: CoinCommandHandler;
    clock?: { nowEpochMs: () => number };
  }
): WorkstyleProfileCommandHandler => {
  let current = cloneSnapshot(initialized);
  const ledger = createCommandLedger<WorkstyleProfileCommandResponse>();
  const diagnostics = options?.diagnostics;
  const outcomeStore = options?.outcomeStore;
  const coinHandler = options?.coinHandler;
  const clock = options?.clock ?? { nowEpochMs: () => Date.now() };
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

  const recordUnexpected = (commandId: string, error: unknown): WorkstyleProfileCommandResponse => {
    const message = error instanceof Error ? error.message : 'unexpected runtime failure';
    const record = diagnostics?.record({
      category: 'unexpected-runtime',
      message,
      context: { commandId, module: 'workstyle-profile' },
    });
    return toFailure({
      kind: 'unexpected-runtime',
      diagnosticId: record?.id ?? 'diag-unavailable',
    });
  };

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

    if (envelope.command.kind === 'purchase-pet-mood-boost') {
      if (!coinHandler) {
        return toFailure({ kind: 'persistence-unavailable' });
      }
      if (current.value.activePetId === null) {
        return toFailure({ kind: 'no-pet-assigned' });
      }
      const coinSnapshot = coinHandler.current();
      if (!coinSnapshot.ok) {
        return toFailure({ kind: 'persistence-unavailable' });
      }
      if (coinSnapshot.value.value.balance < MOOD_BOOST_COIN_COST) {
        return toFailure({
          kind: 'insufficient-coins',
          balance: coinSnapshot.value.value.balance,
          required: MOOD_BOOST_COIN_COST,
        });
      }

      const debit = await coinHandler.execute({
        protocolVersion: 1,
        commandId: `${envelope.commandId}:debit`,
        module: 'coin',
        command: {
          kind: 'debit',
          transactionId: `${envelope.commandId}:debit`,
          amount: MOOD_BOOST_COIN_COST,
          recordedAt: clock.nowEpochMs(),
          reasonCode: 'mood-boost',
          context: { petId: current.value.activePetId },
        },
      });
      if (!debit.ok) {
        if (debit.error.kind === 'insufficient-funds') {
          return toFailure({
            kind: 'insufficient-coins',
            balance: coinSnapshot.value.value.balance,
            required: MOOD_BOOST_COIN_COST,
          });
        }
        return toFailure({ kind: 'persistence-failed' });
      }

      const decided = applyWorkstyleProfileCommand(current.value, {
        kind: 'apply-pet-mood-event',
        event: { kind: 'mood-boost-applied' },
      });
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
      } catch (error) {
        const response = recordUnexpected(envelope.commandId, error);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('workstyle-profile', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
