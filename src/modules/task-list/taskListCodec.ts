import type {
  DocumentCodec,
  Result,
  VersionedDocument,
} from '@/modules/persisted-application-state';
import { isValidTimeEstimateMinutes } from './timeEstimate';
import { createDefaultTaskListValue, type Task, type TaskListValue } from './taskListDocument';

export const TASK_LIST_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTaskStatus = (value: unknown): value is Task['status'] =>
  value === 'to-do' || value === 'in-progress' || value === 'completed';

const parseTask = (value: unknown): Result<Task, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'task must be an object' };
  }
  if (typeof value.id !== 'string' || value.id.length === 0) {
    return { ok: false, error: 'task id must be a non-empty string' };
  }
  if (typeof value.title !== 'string' || value.title.trim().length === 0) {
    return { ok: false, error: 'task title must be a non-empty string' };
  }
  if (!isTaskStatus(value.status)) {
    return { ok: false, error: 'task status must be to-do, in-progress, or completed' };
  }
  if (
    typeof value.originalEstimateMinutes !== 'number' ||
    !Number.isInteger(value.originalEstimateMinutes) ||
    !isValidTimeEstimateMinutes(value.originalEstimateMinutes)
  ) {
    return { ok: false, error: 'task originalEstimateMinutes must be a valid estimate' };
  }
  if (
    typeof value.focusedTimeSeconds !== 'number' ||
    !Number.isInteger(value.focusedTimeSeconds) ||
    value.focusedTimeSeconds < 0
  ) {
    return { ok: false, error: 'task focusedTimeSeconds must be a non-negative integer' };
  }
  if (
    typeof value.createdAtEpochMs !== 'number' ||
    !Number.isFinite(value.createdAtEpochMs) ||
    value.createdAtEpochMs < 0
  ) {
    return { ok: false, error: 'task createdAtEpochMs must be a non-negative finite number' };
  }
  if (
    typeof value.updatedAtEpochMs !== 'number' ||
    !Number.isFinite(value.updatedAtEpochMs) ||
    value.updatedAtEpochMs < 0
  ) {
    return { ok: false, error: 'task updatedAtEpochMs must be a non-negative finite number' };
  }
  if (value.completedAtEpochMs !== undefined) {
    if (
      typeof value.completedAtEpochMs !== 'number' ||
      !Number.isFinite(value.completedAtEpochMs) ||
      value.completedAtEpochMs < 0
    ) {
      return { ok: false, error: 'task completedAtEpochMs must be a non-negative finite number' };
    }
    if (value.status !== 'completed') {
      return { ok: false, error: 'only completed tasks may include completedAtEpochMs' };
    }
  }
  if (value.status === 'completed' && value.completedAtEpochMs === undefined) {
    return { ok: false, error: 'completed tasks must include completedAtEpochMs' };
  }
  return {
    ok: true,
    value: {
      id: value.id,
      title: value.title.trim(),
      status: value.status,
      originalEstimateMinutes: value.originalEstimateMinutes,
      focusedTimeSeconds: value.focusedTimeSeconds,
      createdAtEpochMs: value.createdAtEpochMs,
      updatedAtEpochMs: value.updatedAtEpochMs,
      completedAtEpochMs: value.completedAtEpochMs,
    },
  };
};

const parseTaskListValue = (value: unknown): Result<TaskListValue, string> => {
  if (!isRecord(value)) {
    return { ok: false, error: 'task list value must be an object' };
  }
  if (!Array.isArray(value.tasks)) {
    return { ok: false, error: 'tasks must be an array' };
  }
  const tasks: Task[] = [];
  for (const entry of value.tasks) {
    const parsed = parseTask(entry);
    if (!parsed.ok) {
      return parsed;
    }
    tasks.push(parsed.value);
  }
  return { ok: true, value: { tasks } };
};

export const taskListCodec: DocumentCodec<TaskListValue> = {
  schemaVersion: TASK_LIST_SCHEMA_VERSION,

  createDefault(): VersionedDocument<TaskListValue> {
    return {
      schemaVersion: TASK_LIST_SCHEMA_VERSION,
      revision: 0,
      value: createDefaultTaskListValue(),
    };
  },

  encode(document: VersionedDocument<TaskListValue>): unknown {
    return {
      schemaVersion: document.schemaVersion,
      revision: document.revision,
      value: document.value,
    };
  },

  decode(wire: unknown) {
    if (!isRecord(wire)) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-document' as const,
          message: 'Task List document must be an object',
        },
      };
    }
    if (typeof wire.schemaVersion !== 'number') {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'schemaVersion',
          message: 'schemaVersion must be a number',
        },
      };
    }
    if (wire.schemaVersion !== TASK_LIST_SCHEMA_VERSION) {
      return {
        ok: false as const,
        error: {
          kind: 'unsupported-version' as const,
          message: `Unsupported Task List schema version ${wire.schemaVersion}`,
        },
      };
    }
    if (
      typeof wire.revision !== 'number' ||
      !Number.isInteger(wire.revision) ||
      wire.revision < 0
    ) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'revision',
          message: 'revision must be a non-negative integer',
        },
      };
    }
    const value = parseTaskListValue(wire.value);
    if (!value.ok) {
      return {
        ok: false as const,
        error: {
          kind: 'invalid-field' as const,
          field: 'value',
          message: value.error,
        },
      };
    }
    return {
      ok: true as const,
      value: {
        schemaVersion: wire.schemaVersion,
        revision: wire.revision,
        value: value.value,
      },
    };
  },
};
