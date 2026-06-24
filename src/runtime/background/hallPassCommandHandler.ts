import type {
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  cloneHallPassValue,
  decideCancelPending,
  decideConfirmGrant,
  decideReportBlockedAttempt,
  projectHallPassEntry,
  projectHallPassSnapshot,
  type HallPassValue,
} from '@/modules/hall-pass';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import type { Clock } from '../clock';
import {
  decodeHallPassCommandEnvelope,
  mapDecisionError,
  type HallPassCommandEnvelope,
  type HallPassCommandError,
} from '../protocol/hallPassCommand';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import type { CoinCommandHandler } from '../coinTypes';
import type {
  HallPassCommandHandler,
  HallPassCommandResponse,
  HallPassPublishedSnapshot,
  HallPassRuntimeResult,
} from '../hallPassTypes';

export type HallPassPhaseContextProvider = () => {
  isTimeOut: boolean;
  blockListEntries: readonly string[];
};

const clonePublishedSnapshot = (
  snapshot: HallPassPublishedSnapshot
): HallPassPublishedSnapshot => ({
  revision: snapshot.revision,
  snapshot: {
    ...snapshot.snapshot,
    pendingRequest: snapshot.snapshot.pendingRequest
      ? { ...snapshot.snapshot.pendingRequest }
      : null,
    activePass: snapshot.snapshot.activePass ? { ...snapshot.snapshot.activePass } : null,
  },
  hallPassEntry: snapshot.hallPassEntry,
});

const toSuccess = (snapshot: HallPassPublishedSnapshot): HallPassCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: clonePublishedSnapshot(snapshot),
});

const toFailure = (error: HallPassCommandError): HallPassCommandResponse => ({
  ok: false,
  error,
});

export const createHallPassCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<HallPassValue>,
  options: {
    clock: Clock;
    coinHandler: CoinCommandHandler;
    phaseContext: HallPassPhaseContextProvider;
    diagnostics?: DiagnosticRingBuffer;
    outcomeStore?: CommandOutcomeStore<HallPassCommandResponse>;
    createPassId?: () => string;
  }
): HallPassCommandHandler => {
  let currentDocument = {
    revision: initialized.revision,
    value: cloneHallPassValue(initialized.value),
  };
  const ledger = createCommandLedger<HallPassCommandResponse>();
  const diagnostics = options.diagnostics;
  const outcomeStore = options.outcomeStore;
  const clock = options.clock;
  const coinHandler = options.coinHandler;
  const phaseContext = options.phaseContext;
  const createPassId =
    options.createPassId ??
    (() => `hp-${clock.nowEpochMs()}-${Math.random().toString(36).slice(2, 10)}`);
  const listeners = new Set<(snapshot: HallPassPublishedSnapshot) => void>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('hall-pass');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const readCoinBalance = (): number => {
    const current = coinHandler.current();
    return current.ok ? current.value.value.balance : 0;
  };

  const publishSnapshot = (): HallPassPublishedSnapshot => ({
    revision: currentDocument.revision,
    snapshot: projectHallPassSnapshot(currentDocument.value, readCoinBalance()),
    hallPassEntry: projectHallPassEntry(currentDocument.value),
  });

  const notifyListeners = () => {
    const snapshot = clonePublishedSnapshot(publishSnapshot());
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const commitValue = async (
    nextValue: HallPassValue
  ): Promise<HallPassCommandResponse | { ok: false; error: HallPassCommandError }> => {
    const committed = await persistence.commit([
      {
        document: 'hall-pass',
        expectedRevision: currentDocument.revision,
        value: nextValue,
      },
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return {
          ok: false,
          error: {
            kind: 'stale-revision',
            expectedRevision: currentDocument.revision,
            actualRevision: committed.error.actualRevision,
          },
        };
      }
      return { ok: false, error: { kind: 'persistence-failed' } };
    }
    const next = committed.value.documents['hall-pass'];
    if (!next) {
      return { ok: false, error: { kind: 'persistence-failed' } };
    }
    currentDocument = { revision: next.revision, value: cloneHallPassValue(next.value) };
    notifyListeners();
    return toSuccess(publishSnapshot());
  };

  const recordUnexpected = (commandId: string, error: unknown): HallPassCommandResponse => {
    const message = error instanceof Error ? error.message : 'unexpected runtime failure';
    const record = diagnostics?.record({
      category: 'unexpected-runtime',
      message,
      context: { commandId, module: 'hall-pass' },
    });
    return toFailure({
      kind: 'unexpected-runtime',
      diagnosticId: record?.id ?? 'diag-unavailable',
    });
  };

  const executeFresh = async (
    envelope: HallPassCommandEnvelope
  ): Promise<HallPassCommandResponse> => {
    if (
      envelope.expectedRevision !== undefined &&
      envelope.expectedRevision !== currentDocument.revision
    ) {
      return toFailure({
        kind: 'stale-revision',
        expectedRevision: envelope.expectedRevision,
        actualRevision: currentDocument.revision,
      });
    }

    const phase = phaseContext();

    switch (envelope.command.kind) {
      case 'report-blocked-attempt': {
        const decided = decideReportBlockedAttempt(currentDocument.value, {
          url: String(envelope.command.url),
          requestId: String(envelope.command.requestId),
          reportedAtEpochMs: Number(envelope.command.reportedAtEpochMs),
          context: {
            isTimeOut: phase.isTimeOut,
            blockListEntries: phase.blockListEntries,
          },
        });
        if (!decided.ok) {
          return toFailure(mapDecisionError(decided.error));
        }
        if (decided.value.kind === 'noop') {
          return toSuccess(publishSnapshot());
        }
        return (await commitValue(decided.value.value)) as HallPassCommandResponse;
      }
      case 'confirm-grant': {
        const decided = decideConfirmGrant(currentDocument.value, {
          requestId: String(envelope.command.requestId),
          passId: String(envelope.command.passId ?? createPassId()),
          grantedAtEpochMs: Number(envelope.command.grantedAtEpochMs ?? clock.nowEpochMs()),
          coinBalance: readCoinBalance(),
          context: {
            isTimeOut: phase.isTimeOut,
            blockListEntries: phase.blockListEntries,
          },
        });
        if (!decided.ok) {
          return toFailure(mapDecisionError(decided.error));
        }
        return (await commitValue(decided.value.value)) as HallPassCommandResponse;
      }
      case 'cancel-pending': {
        const decided = decideCancelPending(currentDocument.value, {
          requestId:
            envelope.command.requestId !== undefined
              ? String(envelope.command.requestId)
              : undefined,
          context: {
            isTimeOut: phase.isTimeOut,
            blockListEntries: phase.blockListEntries,
          },
        });
        if (!decided.ok) {
          return toFailure(mapDecisionError(decided.error));
        }
        return (await commitValue(decided.value.value)) as HallPassCommandResponse;
      }
      default:
        return toFailure({ kind: 'malformed-command', message: 'unsupported command' });
    }
  };

  return {
    current(): HallPassRuntimeResult {
      return { ok: true, value: publishSnapshot() };
    },

    async execute(envelope) {
      const decoded = decodeHallPassCommandEnvelope(envelope);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const cached = ledger.get(decoded.value.commandId);
      if (cached) {
        return cached;
      }
      try {
        const response = await executeFresh(decoded.value);
        ledger.set(decoded.value.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('hall-pass', decoded.value.commandId, response);
        }
        return response;
      } catch (error) {
        const response = recordUnexpected(decoded.value.commandId, error);
        ledger.set(decoded.value.commandId, response);
        return response;
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(clonePublishedSnapshot(publishSnapshot()));
      return () => listeners.delete(listener);
    },

    async reportBlockedAttempt(input) {
      return this.execute({
        protocolVersion: RUNTIME_PROTOCOL_VERSION,
        commandId: input.requestId,
        module: 'hall-pass',
        command: {
          kind: 'report-blocked-attempt',
          url: input.url,
          requestId: input.requestId,
          reportedAtEpochMs: input.reportedAtEpochMs,
        },
      });
    },
  };
};
