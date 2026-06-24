import type {
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  applyWorkRhythmCommand,
  cloneWorkRhythmValue,
  decideEndWorkSessionEarly,
  decideFocusBoundarySettlement,
  endWorkSessionEarlyCommandId,
  focusBoundarySettlementCommandId,
  isFocusBoundaryDue,
  projectWorkRhythmSnapshot,
  workRhythmFocusAlarmName,
  type WorkRhythmFocusBlock,
  type WorkRhythmValue,
} from '@/modules/work-rhythm';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import type { Clock } from '../clock';
import type { AlarmAdapter } from '../alarms/types';
import type { EffectExecutor } from '../effects/effectExecutor';
import { runWorkHistoryAppendEffectTransition } from '../effects/workHistoryEffectTransition';
import {
  decodeWorkRhythmCommandEnvelope,
  type WorkRhythmCommandEnvelope,
  type WorkRhythmCommandError,
} from '../protocol/workRhythmCommand';
import type { CoinCommandHandler } from '../coinTypes';
import type {
  WorkRhythmCommandHandler,
  WorkRhythmCommandResponse,
  WorkRhythmPublishedSnapshot,
  WorkRhythmRuntimeResult,
} from '../workRhythmTypes';

const clonePublishedSnapshot = (
  snapshot: WorkRhythmPublishedSnapshot
): WorkRhythmPublishedSnapshot => ({
  revision: snapshot.revision,
  snapshot:
    snapshot.snapshot.phase === 'inactive'
      ? { phase: 'inactive' }
      : snapshot.snapshot.phase === 'focus-block' || snapshot.snapshot.phase === 'recess'
        ? {
            ...snapshot.snapshot,
            schedulerReasonCodes: [...snapshot.snapshot.schedulerReasonCodes],
          }
        : { ...snapshot.snapshot },
});

const toPublishedSnapshot = (
  document: VersionedDocument<WorkRhythmValue>,
  clock: Clock
): WorkRhythmPublishedSnapshot => ({
  revision: document.revision,
  snapshot: projectWorkRhythmSnapshot(document.value, clock.nowEpochMs()),
});

const toSuccess = (snapshot: WorkRhythmPublishedSnapshot): WorkRhythmCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: clonePublishedSnapshot(snapshot),
});

const toFailure = (error: WorkRhythmCommandError): WorkRhythmCommandResponse => ({
  ok: false,
  error,
});

export const createWorkRhythmCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<WorkRhythmValue>,
  options: {
    clock: Clock;
    alarms: AlarmAdapter;
    coinHandler: CoinCommandHandler;
    effectExecutor?: EffectExecutor;
    createSessionId?: () => string;
    diagnostics?: DiagnosticRingBuffer;
    outcomeStore?: CommandOutcomeStore<WorkRhythmCommandResponse>;
  }
): WorkRhythmCommandHandler => {
  let currentDocument = {
    revision: initialized.revision,
    value: cloneWorkRhythmValue(initialized.value),
  };
  const ledger = createCommandLedger<WorkRhythmCommandResponse>();
  const diagnostics = options.diagnostics;
  const outcomeStore = options.outcomeStore;
  const clock = options.clock;
  const alarms = options.alarms;
  const coinHandler = options.coinHandler;
  const effectExecutor = options.effectExecutor;
  const createSessionId =
    options.createSessionId ??
    (() => `ws-${clock.nowEpochMs()}-${Math.random().toString(36).slice(2, 10)}`);
  const listeners = new Set<(snapshot: WorkRhythmPublishedSnapshot) => void>();
  let reconcileInFlight: Promise<WorkRhythmCommandResponse | null> | null = null;

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('work-rhythm');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const publish = () => {
    const snapshot = toPublishedSnapshot(
      {
        schemaVersion: initialized.schemaVersion,
        revision: currentDocument.revision,
        value: currentDocument.value,
      },
      clock
    );
    const cloned = clonePublishedSnapshot(snapshot);
    for (const listener of listeners) {
      listener(cloned);
    }
  };

  const recordUnexpected = (commandId: string, error: unknown): WorkRhythmCommandResponse => {
    const message = error instanceof Error ? error.message : 'unexpected runtime failure';
    const record = diagnostics?.record({
      category: 'unexpected-runtime',
      message,
      context: { commandId, module: 'work-rhythm' },
    });
    return toFailure({
      kind: 'unexpected-runtime',
      diagnosticId: record?.id ?? 'diag-unavailable',
    });
  };

  const scheduleFocusAlarm = async (focus: WorkRhythmFocusBlock): Promise<void> => {
    await alarms.schedule({
      name: workRhythmFocusAlarmName(focus.sessionId),
      whenEpochMs: focus.focusDeadlineAtEpochMs,
    });
  };

  const clearFocusAlarm = async (sessionId: string): Promise<void> => {
    await alarms.clear(workRhythmFocusAlarmName(sessionId));
  };

  const runSettlementEffects = async (input: {
    settlementCommandId: string;
    outcomeRevision: number;
    focusBlockFact?: import('@/modules/work-history').WorkHistoryFact;
    workSessionCompletedFact?: import('@/modules/work-history').WorkHistoryFact;
    coinCredit?: {
      transactionId: string;
      amount: number;
      reasonCode: 'standard-focus' | 'extension-focus';
      recordedAt: number;
      context: Record<string, string | number | boolean | null>;
    };
  }): Promise<void> => {
    if (input.coinCredit) {
      await coinHandler.execute({
        protocolVersion: RUNTIME_PROTOCOL_VERSION,
        commandId: input.coinCredit.transactionId,
        module: 'coin',
        command: {
          kind: 'credit',
          transactionId: input.coinCredit.transactionId,
          amount: input.coinCredit.amount,
          recordedAt: input.coinCredit.recordedAt,
          reasonCode: input.coinCredit.reasonCode,
          context: input.coinCredit.context,
        },
      });
    }

    if (!effectExecutor) {
      return;
    }

    if (input.focusBlockFact) {
      await runWorkHistoryAppendEffectTransition({
        executor: effectExecutor,
        commandId: input.settlementCommandId,
        fact: input.focusBlockFact,
        outcomeRevision: input.outcomeRevision,
      });
    }
    if (input.workSessionCompletedFact) {
      await runWorkHistoryAppendEffectTransition({
        executor: effectExecutor,
        commandId: input.settlementCommandId,
        fact: input.workSessionCompletedFact,
        outcomeRevision: input.outcomeRevision,
      });
    }
  };

  const commitSettlement = async (
    focus: WorkRhythmFocusBlock,
    commandId: string
  ): Promise<WorkRhythmCommandResponse> => {
    const settled = decideFocusBoundarySettlement(focus, clock.nowEpochMs());
    if (!settled.ok) {
      return toFailure(settled.error);
    }
    const outcome = settled.value;
    if (commandId !== outcome.settlementCommandId) {
      return toFailure({ kind: 'malformed-command', message: 'settlement command id mismatch' });
    }

    const committed = await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: currentDocument.revision,
        value: outcome.nextValue,
      },
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return toFailure({
          kind: 'stale-revision',
          expectedRevision: currentDocument.revision,
          actualRevision: committed.error.actualRevision,
        });
      }
      return toFailure({ kind: 'persistence-failed' });
    }

    const workRhythm = committed.value.documents['work-rhythm'];
    if (!workRhythm) {
      return toFailure({ kind: 'persistence-failed' });
    }

    await clearFocusAlarm(focus.sessionId);
    await runSettlementEffects({
      settlementCommandId: outcome.settlementCommandId,
      outcomeRevision: workRhythm.revision,
      focusBlockFact: outcome.focusBlockFact,
      workSessionCompletedFact: outcome.workSessionCompletedFact,
      coinCredit: outcome.coinCredit,
    });

    currentDocument = {
      revision: workRhythm.revision,
      value: cloneWorkRhythmValue(workRhythm.value),
    };
    const snapshot = toPublishedSnapshot(workRhythm, clock);
    publish();
    return toSuccess(snapshot);
  };

  const commitEndWorkSessionEarly = async (
    commandId: string
  ): Promise<WorkRhythmCommandResponse> => {
    const ended = decideEndWorkSessionEarly(currentDocument.value, clock.nowEpochMs());
    if (!ended.ok) {
      return toFailure(ended.error);
    }
    const outcome = ended.value;
    if (commandId !== outcome.commandId) {
      return toFailure({
        kind: 'malformed-command',
        message: 'end-work-session command id mismatch',
      });
    }

    const sessionId =
      currentDocument.value.phase === 'inactive' ? null : currentDocument.value.sessionId;

    const committed = await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: currentDocument.revision,
        value: outcome.nextValue,
      },
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return toFailure({
          kind: 'stale-revision',
          expectedRevision: currentDocument.revision,
          actualRevision: committed.error.actualRevision,
        });
      }
      return toFailure({ kind: 'persistence-failed' });
    }

    const workRhythm = committed.value.documents['work-rhythm'];
    if (!workRhythm) {
      return toFailure({ kind: 'persistence-failed' });
    }

    if (sessionId) {
      await clearFocusAlarm(sessionId);
    }

    await runSettlementEffects({
      settlementCommandId: outcome.commandId,
      outcomeRevision: workRhythm.revision,
      focusBlockFact: outcome.focusBlockFact,
      workSessionCompletedFact: outcome.workSessionCompletedFact,
      coinCredit: outcome.coinCredit,
    });

    currentDocument = {
      revision: workRhythm.revision,
      value: cloneWorkRhythmValue(workRhythm.value),
    };
    const snapshot = toPublishedSnapshot(workRhythm, clock);
    publish();
    return toSuccess(snapshot);
  };

  const executeStart = async (
    envelope: WorkRhythmCommandEnvelope
  ): Promise<WorkRhythmCommandResponse> => {
    const profile = await persistence.read('workstyle-profile');
    if (!profile.ok) {
      return toFailure({ kind: 'persistence-failed' });
    }

    const decided = applyWorkRhythmCommand(currentDocument.value, envelope.command, {
      nowEpochMs: clock.nowEpochMs(),
      sessionId: createSessionId(),
      preferredCadence: profile.value.value.preferredCadence,
      selectedTaskRemainingMinutes: null,
      gameBudget: { kind: 'cards' },
    });
    if (!decided.ok) {
      return toFailure(decided.error);
    }

    const committed = await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: currentDocument.revision,
        value: decided.value,
      },
    ]);
    if (!committed.ok) {
      if (committed.error.kind === 'conflict') {
        return toFailure({
          kind: 'stale-revision',
          expectedRevision: currentDocument.revision,
          actualRevision: committed.error.actualRevision,
        });
      }
      return toFailure({ kind: 'persistence-failed' });
    }

    const workRhythm = committed.value.documents['work-rhythm'];
    if (!workRhythm || workRhythm.value.phase !== 'focus-block') {
      return toFailure({ kind: 'persistence-failed' });
    }

    await scheduleFocusAlarm(workRhythm.value);

    currentDocument = {
      revision: workRhythm.revision,
      value: cloneWorkRhythmValue(workRhythm.value),
    };
    const snapshot = toPublishedSnapshot(workRhythm, clock);
    publish();
    return toSuccess(snapshot);
  };

  const executeFresh = async (
    envelope: WorkRhythmCommandEnvelope
  ): Promise<WorkRhythmCommandResponse> => {
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

    if (envelope.command.kind === 'start-work-session') {
      return executeStart(envelope);
    }

    if (envelope.command.kind === 'settle-focus-boundary') {
      if (currentDocument.value.phase !== 'focus-block') {
        return toFailure({ kind: 'invalid-phase-for-settlement' });
      }
      return commitSettlement(currentDocument.value, envelope.commandId);
    }

    if (envelope.command.kind === 'end-work-session') {
      if (currentDocument.value.phase === 'inactive') {
        return toFailure({ kind: 'no-active-work-session' });
      }
      const expectedCommandId = endWorkSessionEarlyCommandId(currentDocument.value.sessionId);
      if (envelope.commandId !== expectedCommandId) {
        return toFailure({
          kind: 'malformed-command',
          message: 'end-work-session command id must match active session',
        });
      }
      return commitEndWorkSessionEarly(envelope.commandId);
    }

    return toFailure({ kind: 'malformed-command', message: 'unsupported command' });
  };

  const reconcileDueBoundaries = async (): Promise<WorkRhythmCommandResponse | null> => {
    if (reconcileInFlight) {
      return reconcileInFlight;
    }
    reconcileInFlight = (async () => {
      if (currentDocument.value.phase !== 'focus-block') {
        return null;
      }
      const focus = currentDocument.value;
      if (!isFocusBoundaryDue(focus, clock.nowEpochMs())) {
        return null;
      }
      const commandId = focusBoundarySettlementCommandId(focus.sessionId, focus.focusBlockIndex);
      const cached = ledger.get(commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('work-rhythm', commandId);
        if (stored) {
          ledger.set(commandId, stored);
          return stored;
        }
      }
      const response = await commitSettlement(focus, commandId);
      ledger.set(commandId, response);
      if (outcomeStore) {
        await outcomeStore.set('work-rhythm', commandId, response);
      }
      return response;
    })().finally(() => {
      reconcileInFlight = null;
    });
    return reconcileInFlight;
  };

  return {
    current(): WorkRhythmRuntimeResult {
      void reconcileDueBoundaries();
      return {
        ok: true,
        value: toPublishedSnapshot(
          {
            schemaVersion: initialized.schemaVersion,
            revision: currentDocument.revision,
            value: currentDocument.value,
          },
          clock
        ),
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    reconcileDueBoundaries,

    async execute(envelopeInput: unknown): Promise<WorkRhythmCommandResponse> {
      const decoded = decodeWorkRhythmCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('work-rhythm', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('work-rhythm', envelope.commandId, response);
        }
        return response;
      } catch (error) {
        const response = recordUnexpected(envelope.commandId, error);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('work-rhythm', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
