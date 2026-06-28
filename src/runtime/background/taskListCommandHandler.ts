import type {
  PersistedApplicationState,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import {
  applyTaskListCommand,
  cloneTaskListValue,
  projectTaskListSnapshot,
  type TaskListValue,
} from '@/modules/task-list';
import { createCommandLedger } from '../commandLedger';
import type { CommandOutcomeStore } from '../commandOutcomeStore';
import type { Clock } from '../clock';
import {
  decodeTaskListCommandEnvelope,
  mapDecisionError,
  type TaskListCommandEnvelope,
  type TaskListCommandError,
} from '../protocol/taskListCommand';
import type {
  TaskListCommandHandler,
  TaskListCommandResponse,
  TaskListPublishedSnapshot,
  TaskListRuntimeResult,
} from '../taskListTypes';

const clonePublishedSnapshot = (
  snapshot: TaskListPublishedSnapshot
): TaskListPublishedSnapshot => ({
  revision: snapshot.revision,
  snapshot: {
    incompleteTasks: snapshot.snapshot.incompleteTasks.map((task) => ({ ...task })),
    completedTasks: snapshot.snapshot.completedTasks.map((task) => ({ ...task })),
  },
});

const toPublishedSnapshot = (
  document: VersionedDocument<TaskListValue>
): TaskListPublishedSnapshot => ({
  revision: document.revision,
  snapshot: projectTaskListSnapshot(document.value),
});

const toSuccess = (snapshot: TaskListPublishedSnapshot): TaskListCommandResponse => ({
  ok: true,
  revision: snapshot.revision,
  snapshot: clonePublishedSnapshot(snapshot),
});

const toFailure = (error: TaskListCommandError): TaskListCommandResponse => ({
  ok: false,
  error,
});

export const createTaskListCommandHandler = (
  persistence: PersistedApplicationState,
  initialized: VersionedDocument<TaskListValue>,
  options: {
    clock: Clock;
    outcomeStore?: CommandOutcomeStore<TaskListCommandResponse>;
    createTaskId?: () => string;
  }
): TaskListCommandHandler => {
  let currentDocument = {
    revision: initialized.revision,
    value: cloneTaskListValue(initialized.value),
  };
  const ledger = createCommandLedger<TaskListCommandResponse>();
  const outcomeStore = options.outcomeStore;
  const clock = options.clock;
  const createTaskId =
    options.createTaskId ??
    (() => `task-${clock.nowEpochMs()}-${Math.random().toString(36).slice(2, 10)}`);
  const listeners = new Set<(snapshot: TaskListPublishedSnapshot) => void>();

  const hydrateLedgerFromStore = async (): Promise<void> => {
    if (!outcomeStore) {
      return;
    }
    const stored = await outcomeStore.list('task-list');
    for (const entry of stored) {
      ledger.set(entry.commandId, entry.response);
    }
  };
  void hydrateLedgerFromStore();

  const notifyListeners = () => {
    const snapshot = toPublishedSnapshot({
      schemaVersion: initialized.schemaVersion,
      revision: currentDocument.revision,
      value: cloneTaskListValue(currentDocument.value),
    });
    for (const listener of listeners) {
      listener(clonePublishedSnapshot(snapshot));
    }
  };

  const recordUnexpected = (): TaskListCommandResponse => toFailure({ kind: 'unexpected-runtime' });

  const executeFresh = async (
    envelope: TaskListCommandEnvelope
  ): Promise<TaskListCommandResponse> => {
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

    const decision = applyTaskListCommand(currentDocument.value, envelope.command, {
      taskId: envelope.command.kind === 'create-task' ? createTaskId() : undefined,
      nowEpochMs: clock.nowEpochMs(),
    });
    if (!decision.ok) {
      return toFailure(mapDecisionError(decision.error));
    }

    const committed = await persistence.commit([
      {
        document: 'task-list',
        expectedRevision: currentDocument.revision,
        value: decision.value,
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

    const taskList = committed.value.documents['task-list'];
    if (!taskList) {
      return toFailure({ kind: 'persistence-failed' });
    }
    currentDocument = {
      revision: taskList.revision,
      value: cloneTaskListValue(taskList.value),
    };
    notifyListeners();
    return toSuccess(toPublishedSnapshot(taskList));
  };

  return {
    current(): TaskListRuntimeResult {
      return {
        ok: true,
        value: toPublishedSnapshot({
          schemaVersion: initialized.schemaVersion,
          revision: currentDocument.revision,
          value: cloneTaskListValue(currentDocument.value),
        }),
      };
    },

    getDocument(): VersionedDocument<TaskListValue> {
      return {
        schemaVersion: initialized.schemaVersion,
        revision: currentDocument.revision,
        value: cloneTaskListValue(currentDocument.value),
      };
    },

    adoptCommitted(document: VersionedDocument<TaskListValue>) {
      currentDocument = {
        revision: document.revision,
        value: cloneTaskListValue(document.value),
      };
      notifyListeners();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async execute(envelopeInput: unknown): Promise<TaskListCommandResponse> {
      const decoded = decodeTaskListCommandEnvelope(envelopeInput);
      if (!decoded.ok) {
        return toFailure(decoded.error);
      }
      const envelope = decoded.value;

      const cached = ledger.get(envelope.commandId);
      if (cached) {
        return cached;
      }
      if (outcomeStore) {
        const stored = await outcomeStore.get('task-list', envelope.commandId);
        if (stored) {
          ledger.set(envelope.commandId, stored);
          return stored;
        }
      }

      try {
        const response = await executeFresh(envelope);
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('task-list', envelope.commandId, response);
        }
        return response;
      } catch {
        const response = recordUnexpected();
        ledger.set(envelope.commandId, response);
        if (outcomeStore) {
          await outcomeStore.set('task-list', envelope.commandId, response);
        }
        return response;
      }
    },
  };
};
