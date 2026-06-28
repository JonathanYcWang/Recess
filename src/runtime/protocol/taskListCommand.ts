import { RUNTIME_PROTOCOL_VERSION } from './types';
import type { RuntimeCommandEnvelope } from './types';

export type TaskListCommand =
  | { kind: 'create-task'; title: unknown; originalEstimateMinutes: unknown }
  | { kind: 'update-title'; taskId: unknown; title: unknown }
  | { kind: 'reorder-tasks'; orderedTaskIds: unknown }
  | { kind: 'complete-task'; taskId: unknown }
  | { kind: 'delete-task'; taskId: unknown };

export type TaskListCommandError =
  | { kind: 'unsupported-protocol'; supportedVersion: number }
  | { kind: 'malformed-command'; message: string }
  | { kind: 'invalid-module'; module: string }
  | { kind: 'unsupported-command' }
  | { kind: 'invalid-title' }
  | { kind: 'invalid-estimate' }
  | { kind: 'invalid-task-id' }
  | { kind: 'task-not-found'; taskId: string }
  | { kind: 'task-not-incomplete'; taskId: string }
  | { kind: 'invalid-reorder' }
  | { kind: 'stale-revision'; expectedRevision: number; actualRevision: number }
  | { kind: 'persistence-unavailable' }
  | { kind: 'persistence-failed' }
  | { kind: 'unexpected-runtime' };

export type TaskListCommandEnvelope = RuntimeCommandEnvelope<TaskListCommand>;

const mapDecisionError = (
  error: import('@/modules/task-list').TaskListDecisionError
): TaskListCommandError => error;

export const decodeTaskListCommandEnvelope = (
  envelope: unknown
): { ok: true; value: TaskListCommandEnvelope } | { ok: false; error: TaskListCommandError } => {
  if (!envelope || typeof envelope !== 'object') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'envelope must be an object' },
    };
  }

  const candidate = envelope as Record<string, unknown>;

  if (typeof candidate.protocolVersion !== 'number') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'protocolVersion must be a number' },
    };
  }
  if (candidate.protocolVersion !== RUNTIME_PROTOCOL_VERSION) {
    return {
      ok: false,
      error: { kind: 'unsupported-protocol', supportedVersion: RUNTIME_PROTOCOL_VERSION },
    };
  }
  if (typeof candidate.commandId !== 'string' || candidate.commandId.length === 0) {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'commandId must be a non-empty string' },
    };
  }
  if (candidate.module !== 'task-list') {
    return {
      ok: false,
      error: { kind: 'invalid-module', module: String(candidate.module) },
    };
  }
  if (
    candidate.expectedRevision !== undefined &&
    (typeof candidate.expectedRevision !== 'number' ||
      !Number.isInteger(candidate.expectedRevision) ||
      candidate.expectedRevision < 0)
  ) {
    return {
      ok: false,
      error: {
        kind: 'malformed-command',
        message: 'expectedRevision must be a non-negative integer',
      },
    };
  }
  if (!candidate.command || typeof candidate.command !== 'object') {
    return {
      ok: false,
      error: { kind: 'malformed-command', message: 'command must be an object' },
    };
  }

  const command = candidate.command as Record<string, unknown>;
  const base = {
    protocolVersion: candidate.protocolVersion,
    commandId: candidate.commandId,
    module: 'task-list' as const,
    expectedRevision: candidate.expectedRevision,
  };

  if (command.kind === 'create-task') {
    return {
      ok: true,
      value: {
        ...base,
        command: {
          kind: 'create-task',
          title: command.title,
          originalEstimateMinutes: command.originalEstimateMinutes,
        },
      },
    };
  }
  if (command.kind === 'update-title') {
    return {
      ok: true,
      value: {
        ...base,
        command: {
          kind: 'update-title',
          taskId: command.taskId,
          title: command.title,
        },
      },
    };
  }
  if (command.kind === 'reorder-tasks') {
    return {
      ok: true,
      value: {
        ...base,
        command: {
          kind: 'reorder-tasks',
          orderedTaskIds: command.orderedTaskIds,
        },
      },
    };
  }
  if (command.kind === 'complete-task') {
    return {
      ok: true,
      value: {
        ...base,
        command: {
          kind: 'complete-task',
          taskId: command.taskId,
        },
      },
    };
  }
  if (command.kind === 'delete-task') {
    return {
      ok: true,
      value: {
        ...base,
        command: {
          kind: 'delete-task',
          taskId: command.taskId,
        },
      },
    };
  }
  if (command.kind === 'update-estimate' || command.kind === 'set-status') {
    return { ok: false, error: { kind: 'unsupported-command' } };
  }

  return {
    ok: false,
    error: { kind: 'malformed-command', message: 'unsupported Task List command kind' },
  };
};

export { mapDecisionError };
