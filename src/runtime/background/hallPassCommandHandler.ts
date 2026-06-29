import type { PersistedApplicationState, VersionedDocument } from '@/runtime/persistence';
import {
  cloneHallPassValue,
  decideCancelPending,
  decideClearForNonTimeOut,
  decideConfirmGrant,
  decideConfirmReplace,
  decideMeterActivity,
  decideReportBlockedAttempt,
  decideRevokePass,
  decideSettlePassAtBoundary,
  projectHallPassEntry,
  projectHallPassSnapshot,
  type HallPassValue,
} from '@/modules/hall-pass';
import type { BrowserActivityAdapter } from '@/modules/browser-activity/types';
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
    browserActivity: BrowserActivityAdapter;
    phaseContext: HallPassPhaseContextProvider;
    outcomeStore?: CommandOutcomeStore<HallPassCommandResponse>;
    createPassId?: () => string;
  }
): HallPassCommandHandler => {
  let currentDocument = {
    revision: initialized.revision,
    value: cloneHallPassValue(initialized.value),
  };
  const ledger = createCommandLedger<HallPassCommandResponse>();
  const outcomeStore = options.outcomeStore;
  const clock = options.clock;
  const coinHandler = options.coinHandler;
  const browserActivity = options.browserActivity;
  const phaseContext = options.phaseContext;
  const createPassId =
    options.createPassId ??
    (() => `hp-${clock.nowEpochMs()}-${Math.random().toString(36).slice(2, 10)}`);
  const listeners = new Set<(snapshot: HallPassPublishedSnapshot) => void>();
  let meterReconcileInFlight: Promise<HallPassCommandResponse | null> | null = null;

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

  const applyDebits = async (
    debits: Array<{ transactionId: string; amount: number; minuteOrdinal: number }>,
    passId: string,
    nowEpochMs: number
  ): Promise<HallPassCommandResponse | null> => {
    for (const debit of debits) {
      const result = await coinHandler.execute({
        protocolVersion: RUNTIME_PROTOCOL_VERSION,
        commandId: debit.transactionId,
        module: 'coin',
        command: {
          kind: 'debit',
          transactionId: debit.transactionId,
          amount: debit.amount,
          recordedAt: nowEpochMs,
          reasonCode: 'hall-pass',
          context: { passId, minuteOrdinal: debit.minuteOrdinal },
        },
      });
      if (!result.ok) {
        if (result.error.kind === 'insufficient-funds') {
          return toFailure({ kind: 'zero-balance' });
        }
        return toFailure({ kind: 'coin-settlement-failed' });
      }
    }
    return null;
  };

  const recordUnexpected = (): HallPassCommandResponse => toFailure({ kind: 'unexpected-runtime' });

  const meterContext = async (nowEpochMs: number) => {
    const activity = await browserActivity.queryState();
    const context = phaseContext();
    return {
      nowEpochMs,
      coinBalance: readCoinBalance(),
      focusedWindowId: activity.ok ? activity.value.focusedWindowId : null,
      activeTab: activity.ok ? activity.value.activeTab : null,
      context: {
        isTimeOut: context.isTimeOut,
        blockListEntries: context.blockListEntries,
      },
    };
  };

  const settleAtBoundaryInternal = async (input: {
    nowEpochMs: number;
  }): Promise<HallPassCommandResponse> => {
    const meterInput = await meterContext(input.nowEpochMs);
    const decided = decideSettlePassAtBoundary(currentDocument.value, meterInput);
    if (!decided.ok) {
      return toFailure(mapDecisionError(decided.error));
    }
    if (decided.value.kind === 'meter-updated' && decided.value.debits.length > 0) {
      const passId = currentDocument.value.activePass?.passId ?? 'unknown';
      const debitFailure = await applyDebits(decided.value.debits, passId, input.nowEpochMs);
      if (debitFailure) {
        return debitFailure;
      }
      return (await commitValue(decided.value.value)) as HallPassCommandResponse;
    }
    if (decided.value.kind === 'pass-revoked') {
      return (await commitValue(decided.value.value)) as HallPassCommandResponse;
    }
    return toSuccess(publishSnapshot());
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
    const meterInput = await meterContext(clock.nowEpochMs());

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
      case 'confirm-replace': {
        const decided = decideConfirmReplace(currentDocument.value, {
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
      case 'revoke': {
        const decided = decideRevokePass(currentDocument.value, {
          passId:
            envelope.command.passId !== undefined ? String(envelope.command.passId) : undefined,
        });
        if (!decided.ok) {
          return toFailure(mapDecisionError(decided.error));
        }
        const settled = decideSettlePassAtBoundary(currentDocument.value, meterInput);
        if (!settled.ok) {
          return toFailure(mapDecisionError(settled.error));
        }
        if (settled.value.kind === 'meter-updated' && settled.value.debits.length > 0) {
          const passId = currentDocument.value.activePass?.passId ?? 'unknown';
          const debitFailure = await applyDebits(
            settled.value.debits,
            passId,
            meterInput.nowEpochMs
          );
          if (debitFailure) {
            return debitFailure;
          }
        }
        return (await commitValue(decided.value.value)) as HallPassCommandResponse;
      }
      case 'reconcile-meter': {
        const nowEpochMs = Number(envelope.command.nowEpochMs ?? clock.nowEpochMs());
        if (!phase.isTimeOut) {
          if (!currentDocument.value.activePass && !currentDocument.value.pendingRequest) {
            return toSuccess(publishSnapshot());
          }
          if (currentDocument.value.activePass) {
            return settleAtBoundaryInternal({ nowEpochMs });
          }
          const cleared = decideClearForNonTimeOut(currentDocument.value);
          if (!cleared.ok) {
            return toFailure(mapDecisionError(cleared.error));
          }
          return (await commitValue(cleared.value.value)) as HallPassCommandResponse;
        }
        const input = await meterContext(nowEpochMs);
        const decided = decideMeterActivity(currentDocument.value, input);
        if (!decided.ok) {
          return toFailure(mapDecisionError(decided.error));
        }
        if (decided.value.kind === 'noop') {
          return toSuccess(publishSnapshot());
        }
        if (decided.value.kind === 'meter-updated') {
          if (decided.value.debits.length > 0) {
            const passId = currentDocument.value.activePass?.passId ?? 'unknown';
            const debitFailure = await applyDebits(decided.value.debits, passId, input.nowEpochMs);
            if (debitFailure) {
              return debitFailure;
            }
          }
          return (await commitValue(decided.value.value)) as HallPassCommandResponse;
        }
        return toSuccess(publishSnapshot());
      }
      default:
        return toFailure({ kind: 'malformed-command', message: 'unsupported command' });
    }
  };

  const reconcileMeterInternal = async (nowEpochMs?: number): Promise<HallPassCommandResponse> => {
    const envelope: HallPassCommandEnvelope = {
      protocolVersion: RUNTIME_PROTOCOL_VERSION,
      commandId: `meter-${nowEpochMs ?? clock.nowEpochMs()}`,
      module: 'hall-pass',
      command: { kind: 'reconcile-meter', nowEpochMs: nowEpochMs ?? clock.nowEpochMs() },
    };
    return executeFresh(envelope);
  };

  browserActivity.subscribe(() => {
    if (meterReconcileInFlight) {
      return;
    }
    meterReconcileInFlight = reconcileMeterInternal().finally(() => {
      meterReconcileInFlight = null;
    }) as Promise<HallPassCommandResponse | null>;
  });

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
      } catch {
        const response = recordUnexpected();
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

    async settleAtBoundary(input) {
      return settleAtBoundaryInternal({ nowEpochMs: input.nowEpochMs });
    },

    reconcileMeter(input) {
      return reconcileMeterInternal(input?.nowEpochMs);
    },
  };
};
