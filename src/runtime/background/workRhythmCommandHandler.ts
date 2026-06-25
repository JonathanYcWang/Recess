import type {
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  advanceTimeOutBoundaries,
  applyWorkRhythmCommand,
  cloneWorkRhythmValue,
  decideDeclineRecess,
  decideCompleteTask,
  decideEndWorkSessionEarly,
  decideFocusBoundarySettlement,
  decideResumeFromTimeOut,
  decideSelectTasks,
  decideSetActiveTask,
  decideStartTimeOut,
  decideStartWorkSessionExtension,
  declineRecessCommandId,
  endWorkSessionEarlyCommandId,
  focusBoundarySettlementCommandId,
  focusBlockWindDownContext,
  hasTaskSelection,
  isFocusBoundaryDue,
  isTimeOutReportDue,
  isWindDownDue,
  isWindDownEligible,
  nextTimeOutBoundaryEpochMs,
  projectWorkRhythmSnapshot,
  remainingPhaseSeconds,
  resumeFromTimeOutCommandId,
  settleActiveTaskInterval,
  startTimeOutCommandId,
  startWorkSessionExtensionCommandId,
  windDownBoundaryEpochMs,
  windDownCommandId,
  workRhythmFocusAlarmName,
  workRhythmTimeOutReportAlarmName,
  workRhythmWindDownAlarmName,
  createWorkSessionStartedFact,
  workSessionStartedFactId,
  type TaskAttribution,
  type WorkRhythmFocusBlock,
  type WorkRhythmTimeOut,
  type WorkRhythmValue,
  type WorkRhythmWorkSessionCompleted,
} from '@/modules/work-rhythm';
import { consumePendingFocusTaskIds } from '@/modules/task-planner';
import {
  computeSelectedTaskDerivedRemainingSeconds,
  filterSelectedIncompleteTaskIds,
  type TaskListValue,
} from '@/modules/task-list';
import type { DiagnosticRingBuffer } from '@/modules/persisted-application-state/diagnostics/diagnosticRingBuffer';
import { RUNTIME_PROTOCOL_VERSION } from '../protocol/types';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import type { Clock } from '../clock';
import type { AlarmAdapter } from '../alarms/types';
import type { EffectExecutor } from '../effects/effectExecutor';
import { runWorkHistoryAppendEffectTransition } from '../effects/workHistoryEffectTransition';
import { runWindDownEffectTransition } from '../windDown/windDownEffectTransition';
import {
  decodeWorkRhythmCommandEnvelope,
  type WorkRhythmCommandEnvelope,
  type WorkRhythmCommandError,
} from '../protocol/workRhythmCommand';
import type { CoinCommandHandler } from '../coinTypes';
import type { TaskListCommandHandler } from '../taskListTypes';
import {
  createNoOpTimeOutReportNotifier,
  type TimeOutReportNotifier,
} from '../timeOut/timeOutReportNotifier';
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
    taskListHandler: TaskListCommandHandler;
    effectExecutor?: EffectExecutor;
    createSessionId?: () => string;
    diagnostics?: DiagnosticRingBuffer;
    outcomeStore?: CommandOutcomeStore<WorkRhythmCommandResponse>;
    timeOutReportNotifier?: TimeOutReportNotifier;
    onWorkSessionStarted?: (input: {
      workSessionId: string;
      startedAtEpochMs: number;
    }) => Promise<void>;
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
  const taskListHandler = options.taskListHandler;
  const effectExecutor = options.effectExecutor;
  const onWorkSessionStarted = options.onWorkSessionStarted;
  const timeOutReportNotifier = options.timeOutReportNotifier ?? createNoOpTimeOutReportNotifier();
  const createSessionId =
    options.createSessionId ??
    (() => `ws-${clock.nowEpochMs()}-${Math.random().toString(36).slice(2, 10)}`);
  const listeners = new Set<(snapshot: WorkRhythmPublishedSnapshot) => void>();
  let reconcileInFlight: Promise<WorkRhythmCommandResponse | null> | null = null;
  let timeOutReconcileInFlight: Promise<WorkRhythmCommandResponse | null> | null = null;
  let windDownReconcileInFlight: Promise<WorkRhythmCommandResponse | null> | null = null;

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

  type TaskListCommit = {
    expectedRevision: number;
    value: TaskListValue;
  };

  const readSelectedTaskRemainingSeconds = (): number | null => {
    if (!hasTaskSelection(currentDocument.value)) {
      return null;
    }
    if (currentDocument.value.selectedTaskIds.length === 0) {
      return null;
    }
    return computeSelectedTaskDerivedRemainingSeconds(
      taskListHandler.getDocument().value,
      currentDocument.value.selectedTaskIds
    );
  };

  const readStartTaskCapInput = (): {
    selectedTaskRemainingSeconds: number | null;
    confirmedFocusTaskIds: string[];
  } => {
    const pendingTaskIds = consumePendingFocusTaskIds();
    const taskList = taskListHandler.getDocument().value;
    const confirmedFocusTaskIds = filterSelectedIncompleteTaskIds(taskList, pendingTaskIds);
    return {
      confirmedFocusTaskIds,
      selectedTaskRemainingSeconds: computeSelectedTaskDerivedRemainingSeconds(
        taskList,
        confirmedFocusTaskIds
      ),
    };
  };

  const settleTaskAttributionForPhase = (
    nowEpochMs: number
  ):
    | {
        ok: true;
        value: { taskListCommit: TaskListCommit | null; attribution: TaskAttribution | null };
      }
    | { ok: false; error: WorkRhythmCommandError } => {
    if (!hasTaskSelection(currentDocument.value)) {
      return { ok: true, value: { taskListCommit: null, attribution: null } };
    }
    const taskListDoc = taskListHandler.getDocument();
    const settled = settleActiveTaskInterval(currentDocument.value, taskListDoc.value, nowEpochMs);
    if (!settled.ok) {
      return { ok: false, error: settled.error };
    }
    if (!settled.value.attribution) {
      return { ok: true, value: { taskListCommit: null, attribution: null } };
    }
    return {
      ok: true,
      value: {
        taskListCommit: {
          expectedRevision: taskListDoc.revision,
          value: settled.value.nextTaskList,
        },
        attribution: settled.value.attribution,
      },
    };
  };

  const commitWorkRhythmDocuments = async (
    workRhythmValue: WorkRhythmValue,
    taskListCommit: TaskListCommit | null
  ): Promise<
    | {
        ok: true;
        value: {
          workRhythm: { revision: number; value: WorkRhythmValue };
          taskList?: { revision: number; value: TaskListValue };
        };
      }
    | { ok: false; error: WorkRhythmCommandError }
  > => {
    const commits: Array<{
      document: 'work-rhythm' | 'task-list';
      expectedRevision: number;
      value: WorkRhythmValue | TaskListValue;
    }> = [
      {
        document: 'work-rhythm',
        expectedRevision: currentDocument.revision,
        value: workRhythmValue,
      },
    ];
    if (taskListCommit) {
      commits.push({
        document: 'task-list',
        expectedRevision: taskListCommit.expectedRevision,
        value: taskListCommit.value,
      });
    }
    const committed = await persistence.commit(commits);
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
    const workRhythm = committed.value.documents['work-rhythm'];
    if (!workRhythm) {
      return { ok: false, error: { kind: 'persistence-failed' } };
    }
    const taskList = committed.value.documents['task-list'];
    if (taskListCommit && !taskList) {
      return { ok: false, error: { kind: 'persistence-failed' } };
    }
    return {
      ok: true,
      value: {
        workRhythm,
        taskList: taskList ?? undefined,
      },
    };
  };

  const appendTaskAttributionHistory = async (input: {
    commandId: string;
    attribution: TaskAttribution;
    outcomeRevision: number;
  }): Promise<void> => {
    if (!effectExecutor) {
      return;
    }
    await runWorkHistoryAppendEffectTransition({
      executor: effectExecutor,
      commandId: input.commandId,
      fact: input.attribution.fact,
      outcomeRevision: input.outcomeRevision,
    });
  };

  const scheduleFocusAlarm = async (focus: WorkRhythmFocusBlock): Promise<void> => {
    await alarms.schedule({
      name: workRhythmFocusAlarmName(focus.sessionId),
      whenEpochMs: focus.focusDeadlineAtEpochMs,
    });
    await scheduleWindDownAlarm(focus);
  };

  const scheduleWindDownAlarm = async (focus: WorkRhythmFocusBlock): Promise<void> => {
    const context = focusBlockWindDownContext(focus);
    if (!isWindDownEligible(context.phaseDurationSeconds)) {
      await clearWindDownAlarm(focus.sessionId);
      return;
    }
    await alarms.schedule({
      name: workRhythmWindDownAlarmName(focus.sessionId),
      whenEpochMs: windDownBoundaryEpochMs(focus.focusDeadlineAtEpochMs),
    });
  };

  const clearWindDownAlarm = async (sessionId: string): Promise<void> => {
    await alarms.clear(workRhythmWindDownAlarmName(sessionId));
  };

  const clearFocusAlarm = async (sessionId: string): Promise<void> => {
    await alarms.clear(workRhythmFocusAlarmName(sessionId));
  };

  const scheduleTimeOutReportAlarm = async (timeOut: WorkRhythmTimeOut): Promise<void> => {
    await alarms.schedule({
      name: workRhythmTimeOutReportAlarmName(timeOut.sessionId),
      whenEpochMs: nextTimeOutBoundaryEpochMs(timeOut),
    });
  };

  const clearTimeOutAlarm = async (sessionId: string): Promise<void> => {
    await alarms.clear(workRhythmTimeOutReportAlarmName(sessionId));
  };

  const clearSessionAlarms = async (sessionId: string): Promise<void> => {
    await clearFocusAlarm(sessionId);
    await clearWindDownAlarm(sessionId);
    await clearTimeOutAlarm(sessionId);
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
    streakCoinCredit?: {
      transactionId: string;
      amount: number;
      reasonCode: 'focus-block-streak';
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

    if (input.streakCoinCredit) {
      await coinHandler.execute({
        protocolVersion: RUNTIME_PROTOCOL_VERSION,
        commandId: input.streakCoinCredit.transactionId,
        module: 'coin',
        command: {
          kind: 'credit',
          transactionId: input.streakCoinCredit.transactionId,
          amount: input.streakCoinCredit.amount,
          recordedAt: input.streakCoinCredit.recordedAt,
          reasonCode: input.streakCoinCredit.reasonCode,
          context: input.streakCoinCredit.context,
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
    const nowEpochMs = clock.nowEpochMs();
    const taskSettlement = settleTaskAttributionForPhase(nowEpochMs);
    if (!taskSettlement.ok) {
      return toFailure(taskSettlement.error);
    }

    const settled = decideFocusBoundarySettlement(focus, nowEpochMs);
    if (!settled.ok) {
      return toFailure(settled.error);
    }
    const outcome = settled.value;
    if (commandId !== outcome.settlementCommandId) {
      return toFailure({ kind: 'malformed-command', message: 'settlement command id mismatch' });
    }

    const committed = await commitWorkRhythmDocuments(
      outcome.nextValue,
      taskSettlement.value.taskListCommit
    );
    if (!committed.ok) {
      return toFailure(committed.error);
    }

    const workRhythm = committed.value.workRhythm;
    if (taskSettlement.value.taskListCommit && committed.value.taskList) {
      taskListHandler.adoptCommitted({
        schemaVersion: initialized.schemaVersion,
        revision: committed.value.taskList.revision,
        value: committed.value.taskList.value,
      });
    }

    await clearFocusAlarm(focus.sessionId);
    await clearWindDownAlarm(focus.sessionId);
    await runSettlementEffects({
      settlementCommandId: outcome.settlementCommandId,
      outcomeRevision: workRhythm.revision,
      focusBlockFact: outcome.focusBlockFact,
      workSessionCompletedFact: outcome.workSessionCompletedFact,
      coinCredit: outcome.coinCredit,
      streakCoinCredit: outcome.streakCoinCredit,
    });
    if (taskSettlement.value.attribution) {
      await appendTaskAttributionHistory({
        commandId,
        attribution: taskSettlement.value.attribution,
        outcomeRevision: workRhythm.revision,
      });
    }

    currentDocument = {
      revision: workRhythm.revision,
      value: cloneWorkRhythmValue(workRhythm.value),
    };
    const snapshot = toPublishedSnapshot(
      {
        schemaVersion: initialized.schemaVersion,
        revision: workRhythm.revision,
        value: workRhythm.value,
      },
      clock
    );
    publish();
    return toSuccess(snapshot);
  };

  const commitEndWorkSessionEarly = async (
    commandId: string
  ): Promise<WorkRhythmCommandResponse> => {
    const nowEpochMs = clock.nowEpochMs();
    const taskSettlement = settleTaskAttributionForPhase(nowEpochMs);
    if (!taskSettlement.ok) {
      return toFailure(taskSettlement.error);
    }

    const ended = decideEndWorkSessionEarly(currentDocument.value, nowEpochMs);
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

    const committed = await commitWorkRhythmDocuments(
      outcome.nextValue,
      taskSettlement.value.taskListCommit
    );
    if (!committed.ok) {
      return toFailure(committed.error);
    }

    const workRhythm = committed.value.workRhythm;
    if (taskSettlement.value.taskListCommit && committed.value.taskList) {
      taskListHandler.adoptCommitted({
        schemaVersion: initialized.schemaVersion,
        revision: committed.value.taskList.revision,
        value: committed.value.taskList.value,
      });
    }

    if (sessionId) {
      await clearSessionAlarms(sessionId);
    }

    await runSettlementEffects({
      settlementCommandId: outcome.commandId,
      outcomeRevision: workRhythm.revision,
      focusBlockFact: outcome.focusBlockFact,
      workSessionCompletedFact: outcome.workSessionCompletedFact,
      coinCredit: outcome.coinCredit,
    });
    if (taskSettlement.value.attribution) {
      await appendTaskAttributionHistory({
        commandId,
        attribution: taskSettlement.value.attribution,
        outcomeRevision: workRhythm.revision,
      });
    }

    currentDocument = {
      revision: workRhythm.revision,
      value: cloneWorkRhythmValue(workRhythm.value),
    };
    const snapshot = toPublishedSnapshot(
      {
        schemaVersion: initialized.schemaVersion,
        revision: workRhythm.revision,
        value: workRhythm.value,
      },
      clock
    );
    publish();
    return toSuccess(snapshot);
  };

  const commitStartTimeOut = async (commandId: string): Promise<WorkRhythmCommandResponse> => {
    const nowEpochMs = clock.nowEpochMs();
    const taskSettlement = settleTaskAttributionForPhase(nowEpochMs);
    if (!taskSettlement.ok) {
      return toFailure(taskSettlement.error);
    }

    const started = decideStartTimeOut(currentDocument.value, nowEpochMs);
    if (!started.ok) {
      return toFailure(started.error);
    }
    const outcome = started.value;
    if (commandId !== outcome.commandId) {
      return toFailure({
        kind: 'malformed-command',
        message: 'start-time-out command id mismatch',
      });
    }

    const sessionId =
      currentDocument.value.phase === 'focus-block' ? currentDocument.value.sessionId : null;

    const committed = await commitWorkRhythmDocuments(
      outcome.nextValue,
      taskSettlement.value.taskListCommit
    );
    if (!committed.ok) {
      return toFailure(committed.error);
    }

    const workRhythm = committed.value.workRhythm;
    if (!workRhythm || workRhythm.value.phase !== 'time-out') {
      return toFailure({ kind: 'persistence-failed' });
    }
    if (taskSettlement.value.taskListCommit && committed.value.taskList) {
      taskListHandler.adoptCommitted({
        schemaVersion: initialized.schemaVersion,
        revision: committed.value.taskList.revision,
        value: committed.value.taskList.value,
      });
    }

    if (sessionId) {
      await clearFocusAlarm(sessionId);
      await clearWindDownAlarm(sessionId);
    }
    await scheduleTimeOutReportAlarm(workRhythm.value);
    if (taskSettlement.value.attribution) {
      await appendTaskAttributionHistory({
        commandId,
        attribution: taskSettlement.value.attribution,
        outcomeRevision: workRhythm.revision,
      });
    }

    currentDocument = {
      revision: workRhythm.revision,
      value: cloneWorkRhythmValue(workRhythm.value),
    };
    const snapshot = toPublishedSnapshot(
      {
        schemaVersion: initialized.schemaVersion,
        revision: workRhythm.revision,
        value: workRhythm.value,
      },
      clock
    );
    publish();
    return toSuccess(snapshot);
  };

  const commitResumeFromTimeOut = async (commandId: string): Promise<WorkRhythmCommandResponse> => {
    await reconcileTimeOutReports();

    const resumed = decideResumeFromTimeOut(currentDocument.value, clock.nowEpochMs());
    if (!resumed.ok) {
      return toFailure(resumed.error);
    }
    const outcome = resumed.value;
    if (commandId !== outcome.commandId) {
      return toFailure({
        kind: 'malformed-command',
        message: 'resume-from-time-out command id mismatch',
      });
    }

    const sessionId =
      currentDocument.value.phase === 'time-out' ? currentDocument.value.sessionId : null;

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
    if (!workRhythm || workRhythm.value.phase !== 'focus-block') {
      return toFailure({ kind: 'persistence-failed' });
    }

    if (sessionId) {
      await clearTimeOutAlarm(sessionId);
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

  const commitDeclineRecess = async (commandId: string): Promise<WorkRhythmCommandResponse> => {
    const profile = await persistence.read('workstyle-profile');
    if (!profile.ok) {
      return toFailure({ kind: 'persistence-failed' });
    }

    const declined = decideDeclineRecess(currentDocument.value, {
      nowEpochMs: clock.nowEpochMs(),
      preferredCadence: profile.value.value.preferredCadence,
      selectedTaskRemainingSeconds: readSelectedTaskRemainingSeconds(),
      gameBudget: { kind: 'cards' },
    });
    if (!declined.ok) {
      return toFailure(declined.error);
    }
    if (commandId !== declined.value.commandId) {
      return toFailure({
        kind: 'malformed-command',
        message: 'decline-recess command id mismatch',
      });
    }

    const committed = await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: currentDocument.revision,
        value: declined.value.nextValue,
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

  const commitStartWorkSessionExtension = async (
    commandId: string,
    extensionSeconds: unknown
  ): Promise<WorkRhythmCommandResponse> => {
    if (currentDocument.value.phase !== 'work-session-completed') {
      return toFailure({ kind: 'invalid-phase-for-extension' });
    }
    const completed = currentDocument.value as WorkRhythmWorkSessionCompleted;
    const expectedCommandId = startWorkSessionExtensionCommandId(
      completed.sessionId,
      completed.extensionCount
    );
    if (commandId !== expectedCommandId) {
      return toFailure({
        kind: 'malformed-command',
        message: 'start-work-session-extension command id must match active session',
      });
    }

    const profile = await persistence.read('workstyle-profile');
    if (!profile.ok) {
      return toFailure({ kind: 'persistence-failed' });
    }

    const extended = decideStartWorkSessionExtension(currentDocument.value, extensionSeconds, {
      nowEpochMs: clock.nowEpochMs(),
      preferredCadence: profile.value.value.preferredCadence,
      selectedTaskRemainingSeconds: readSelectedTaskRemainingSeconds(),
      gameBudget: { kind: 'cards' },
    });
    if (!extended.ok) {
      return toFailure(extended.error);
    }
    if (commandId !== extended.value.commandId) {
      return toFailure({
        kind: 'malformed-command',
        message: 'start-work-session-extension command id mismatch',
      });
    }

    const committed = await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: currentDocument.revision,
        value: extended.value.nextValue,
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

  const executeStart = async (
    envelope: WorkRhythmCommandEnvelope
  ): Promise<WorkRhythmCommandResponse> => {
    const profile = await persistence.read('workstyle-profile');
    if (!profile.ok) {
      return toFailure({ kind: 'persistence-failed' });
    }

    const sessionId = createSessionId();
    const nowEpochMs = clock.nowEpochMs();
    const startTaskCap = readStartTaskCapInput();
    const decided = applyWorkRhythmCommand(currentDocument.value, envelope.command, {
      nowEpochMs,
      sessionId,
      preferredCadence: profile.value.value.preferredCadence,
      selectedTaskRemainingSeconds: startTaskCap.selectedTaskRemainingSeconds,
      confirmedFocusTaskIds: startTaskCap.confirmedFocusTaskIds,
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

    if (effectExecutor) {
      await runWorkHistoryAppendEffectTransition({
        executor: effectExecutor,
        commandId: envelope.commandId,
        fact: createWorkSessionStartedFact({
          factId: workSessionStartedFactId(workRhythm.value.sessionId),
          recordedAt: nowEpochMs,
          workSessionId: workRhythm.value.sessionId,
          startedAtEpochMs: workRhythm.value.sessionStartedAtEpochMs,
          goalSeconds: workRhythm.value.originalGoalSeconds,
          energy: workRhythm.value.energy,
        }),
        outcomeRevision: workRhythm.revision,
      });
    }

    if (onWorkSessionStarted) {
      await onWorkSessionStarted({
        workSessionId: workRhythm.value.sessionId,
        startedAtEpochMs: workRhythm.value.sessionStartedAtEpochMs,
      });
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

  const commitTaskSelectionChange = async (
    envelope: WorkRhythmCommandEnvelope,
    decided: {
      nextValue: WorkRhythmValue;
      nextTaskList: TaskListValue;
      attribution: TaskAttribution | null;
    }
  ): Promise<WorkRhythmCommandResponse> => {
    const taskListDoc = taskListHandler.getDocument();
    const committed = await persistence.commit([
      {
        document: 'work-rhythm',
        expectedRevision: currentDocument.revision,
        value: decided.nextValue,
      },
      {
        document: 'task-list',
        expectedRevision: taskListDoc.revision,
        value: decided.nextTaskList,
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
    const taskList = committed.value.documents['task-list'];
    if (!workRhythm || !taskList) {
      return toFailure({ kind: 'persistence-failed' });
    }

    taskListHandler.adoptCommitted(taskList);
    if (decided.attribution) {
      await appendTaskAttributionHistory({
        commandId: envelope.commandId,
        attribution: decided.attribution,
        outcomeRevision: workRhythm.revision,
      });
    }

    currentDocument = {
      revision: workRhythm.revision,
      value: cloneWorkRhythmValue(workRhythm.value),
    };
    const snapshot = toPublishedSnapshot(workRhythm, clock);
    publish();
    return toSuccess(snapshot);
  };

  const commitSelectTasks = async (
    envelope: WorkRhythmCommandEnvelope
  ): Promise<WorkRhythmCommandResponse> => {
    const taskListDoc = taskListHandler.getDocument();
    const decided = decideSelectTasks(
      currentDocument.value,
      taskListDoc.value,
      envelope.command.kind === 'select-tasks' ? envelope.command.taskIds : [],
      clock.nowEpochMs()
    );
    if (!decided.ok) {
      return toFailure(decided.error);
    }
    return commitTaskSelectionChange(envelope, decided.value);
  };

  const commitSetActiveTask = async (
    envelope: WorkRhythmCommandEnvelope
  ): Promise<WorkRhythmCommandResponse> => {
    const taskListDoc = taskListHandler.getDocument();
    const decided = decideSetActiveTask(
      currentDocument.value,
      taskListDoc.value,
      envelope.command.kind === 'set-active-task' ? envelope.command.taskId : null,
      clock.nowEpochMs()
    );
    if (!decided.ok) {
      return toFailure(decided.error);
    }
    return commitTaskSelectionChange(envelope, decided.value);
  };

  const commitCompleteTask = async (
    envelope: WorkRhythmCommandEnvelope
  ): Promise<WorkRhythmCommandResponse> => {
    const taskListDoc = taskListHandler.getDocument();
    const decided = decideCompleteTask(
      currentDocument.value,
      taskListDoc.value,
      envelope.command.kind === 'complete-task' ? envelope.command.taskId : null,
      clock.nowEpochMs()
    );
    if (!decided.ok) {
      return toFailure(decided.error);
    }
    return commitTaskSelectionChange(envelope, decided.value);
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

    if (envelope.command.kind === 'start-time-out') {
      if (currentDocument.value.phase !== 'focus-block') {
        if (currentDocument.value.phase === 'time-out') {
          return toFailure({ kind: 'already-in-time-out' });
        }
        return toFailure({ kind: 'invalid-phase-for-time-out' });
      }
      const expectedCommandId = startTimeOutCommandId(currentDocument.value.sessionId);
      if (envelope.commandId !== expectedCommandId) {
        return toFailure({
          kind: 'malformed-command',
          message: 'start-time-out command id must match active session',
        });
      }
      return commitStartTimeOut(envelope.commandId);
    }

    if (envelope.command.kind === 'resume-from-time-out') {
      if (currentDocument.value.phase !== 'time-out') {
        return toFailure({ kind: 'not-in-time-out' });
      }
      const expectedCommandId = resumeFromTimeOutCommandId(currentDocument.value.sessionId);
      if (envelope.commandId !== expectedCommandId) {
        return toFailure({
          kind: 'malformed-command',
          message: 'resume-from-time-out command id must match active session',
        });
      }
      return commitResumeFromTimeOut(envelope.commandId);
    }

    if (envelope.command.kind === 'decline-recess') {
      if (currentDocument.value.phase !== 'recess-prompt') {
        return toFailure({ kind: 'invalid-phase-for-decline-recess' });
      }
      const expectedCommandId = declineRecessCommandId(
        currentDocument.value.sessionId,
        currentDocument.value.completedFocusBlockIndex,
        currentDocument.value.lastSettledSegment + 1
      );
      if (envelope.commandId !== expectedCommandId) {
        return toFailure({
          kind: 'malformed-command',
          message: 'decline-recess command id must match active recess prompt',
        });
      }
      return commitDeclineRecess(envelope.commandId);
    }

    if (envelope.command.kind === 'start-work-session-extension') {
      return commitStartWorkSessionExtension(envelope.commandId, envelope.command.extensionSeconds);
    }

    if (envelope.command.kind === 'select-tasks') {
      return commitSelectTasks(envelope);
    }

    if (envelope.command.kind === 'set-active-task') {
      return commitSetActiveTask(envelope);
    }

    if (envelope.command.kind === 'complete-task') {
      return commitCompleteTask(envelope);
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
      const commandId = focusBoundarySettlementCommandId(
        focus.sessionId,
        focus.focusBlockIndex,
        focus.settlementSegment
      );
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

  const runTimeOutReportEffects = async (input: {
    sessionId: string;
    events: import('@/modules/work-rhythm').TimeOutBoundaryEvent[];
    outcomeRevision: number;
  }): Promise<void> => {
    for (const event of input.events) {
      const cached = ledger.get(event.commandId);
      if (cached) {
        continue;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('work-rhythm', event.commandId);
        if (stored) {
          ledger.set(event.commandId, stored);
          continue;
        }
      }
      await timeOutReportNotifier.notify({
        sessionId: input.sessionId,
        boundaryIndex: event.boundaryIndex,
        elapsedMinutes: event.elapsedMinutes,
      });
      const response = toSuccess(
        toPublishedSnapshot(
          {
            schemaVersion: initialized.schemaVersion,
            revision: input.outcomeRevision,
            value: currentDocument.value,
          },
          clock
        )
      );
      ledger.set(event.commandId, response);
      if (outcomeStore) {
        await outcomeStore.set('work-rhythm', event.commandId, response);
      }
    }
  };

  const readWindDownSoundEnabled = async (): Promise<boolean> => {
    const settings = await persistence.read('settings');
    if (!settings.ok) {
      return false;
    }
    return settings.value.value.windDownSoundEnabled;
  };

  const runWindDownEffects = async (input: {
    commandId: string;
    context: import('@/modules/work-rhythm').WindDownPhaseContext;
    outcomeRevision: number;
  }): Promise<void> => {
    if (!effectExecutor) {
      return;
    }
    const soundEnabled = await readWindDownSoundEnabled();
    await runWindDownEffectTransition({
      executor: effectExecutor,
      commandId: input.commandId,
      payload: {
        sessionId: input.context.sessionId,
        phaseKind: input.context.phaseKind,
        remainingSeconds: String(
          remainingPhaseSeconds(input.context.phaseEndEpochMs, clock.nowEpochMs())
        ),
      },
      soundEnabled,
      outcomeRevision: input.outcomeRevision,
    });
  };

  const reconcileWindDownSignals = async (): Promise<WorkRhythmCommandResponse | null> => {
    if (windDownReconcileInFlight) {
      return windDownReconcileInFlight;
    }
    windDownReconcileInFlight = (async () => {
      if (currentDocument.value.phase !== 'focus-block') {
        return null;
      }
      const focus = currentDocument.value;
      const context = focusBlockWindDownContext(focus);
      if (!isWindDownDue(context, clock.nowEpochMs())) {
        return null;
      }
      const commandId = windDownCommandId(context.sessionId, context.phaseKind, context.segmentKey);
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

      await runWindDownEffects({
        commandId,
        context,
        outcomeRevision: currentDocument.revision,
      });

      const response = toSuccess(
        toPublishedSnapshot(
          {
            schemaVersion: initialized.schemaVersion,
            revision: currentDocument.revision,
            value: currentDocument.value,
          },
          clock
        )
      );
      ledger.set(commandId, response);
      if (outcomeStore) {
        await outcomeStore.set('work-rhythm', commandId, response);
      }
      publish();
      return response;
    })().finally(() => {
      windDownReconcileInFlight = null;
    });
    return windDownReconcileInFlight;
  };

  const reconcileTimeOutReports = async (): Promise<WorkRhythmCommandResponse | null> => {
    if (timeOutReconcileInFlight) {
      return timeOutReconcileInFlight;
    }
    timeOutReconcileInFlight = (async () => {
      if (currentDocument.value.phase !== 'time-out') {
        return null;
      }
      const timeOut = currentDocument.value;
      if (!isTimeOutReportDue(timeOut, clock.nowEpochMs())) {
        return null;
      }

      const advanced = advanceTimeOutBoundaries(timeOut, clock.nowEpochMs());
      if (advanced.events.length === 0) {
        return null;
      }

      const committed = await persistence.commit([
        {
          document: 'work-rhythm',
          expectedRevision: currentDocument.revision,
          value: advanced.nextValue,
        },
      ]);
      if (!committed.ok) {
        return null;
      }

      const workRhythm = committed.value.documents['work-rhythm'];
      if (!workRhythm || workRhythm.value.phase !== 'time-out') {
        return null;
      }

      currentDocument = {
        revision: workRhythm.revision,
        value: cloneWorkRhythmValue(workRhythm.value),
      };

      await runTimeOutReportEffects({
        sessionId: workRhythm.value.sessionId,
        events: advanced.events,
        outcomeRevision: workRhythm.revision,
      });
      await scheduleTimeOutReportAlarm(workRhythm.value);

      const snapshot = toPublishedSnapshot(workRhythm, clock);
      publish();
      return toSuccess(snapshot);
    })().finally(() => {
      timeOutReconcileInFlight = null;
    });
    return timeOutReconcileInFlight;
  };

  return {
    current(): WorkRhythmRuntimeResult {
      void reconcileDueBoundaries();
      void reconcileTimeOutReports();
      void reconcileWindDownSignals();
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

    reconcileTimeOutReports,

    reconcileWindDownSignals,

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
