import type { Result } from '@/modules/persisted-application-state/types';
import { isValidTimeEstimateMinutes } from './timeEstimate';
import {
  cloneTask,
  cloneTaskListValue,
  isIncompleteTask,
  type Task,
  type TaskListValue,
} from './taskListDocument';

export type TaskListCommand =
  | { kind: 'create-task'; title: unknown; originalEstimateMinutes: unknown }
  | { kind: 'update-title'; taskId: unknown; title: unknown }
  | { kind: 'reorder-tasks'; orderedTaskIds: unknown }
  | { kind: 'complete-task'; taskId: unknown }
  | { kind: 'delete-task'; taskId: unknown }
  | { kind: 'update-estimate'; taskId: unknown; originalEstimateMinutes: unknown }
  | { kind: 'set-status'; taskId: unknown; status: unknown };

export type TaskListDecisionError =
  | { kind: 'unsupported-command' }
  | { kind: 'invalid-title' }
  | { kind: 'invalid-estimate' }
  | { kind: 'invalid-task-id' }
  | { kind: 'task-not-found'; taskId: string }
  | { kind: 'task-not-incomplete'; taskId: string }
  | { kind: 'invalid-reorder' };

const parseTitle = (value: unknown): Result<string, TaskListDecisionError> => {
  if (typeof value !== 'string') {
    return { ok: false, error: { kind: 'invalid-title' } };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { kind: 'invalid-title' } };
  }
  return { ok: true, value: trimmed };
};

const parseTaskId = (value: unknown): Result<string, TaskListDecisionError> => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error: { kind: 'invalid-task-id' } };
  }
  return { ok: true, value: value.trim() };
};

const parseEstimate = (value: unknown): Result<number, TaskListDecisionError> => {
  if (typeof value !== 'number' || !Number.isInteger(value) || !isValidTimeEstimateMinutes(value)) {
    return { ok: false, error: { kind: 'invalid-estimate' } };
  }
  return { ok: true, value };
};

const findTaskIndex = (value: TaskListValue, taskId: string): number =>
  value.tasks.findIndex((task) => task.id === taskId);

const incompleteTasks = (value: TaskListValue): Task[] =>
  value.tasks.filter((task) => isIncompleteTask(task));

const completedTasks = (value: TaskListValue): Task[] =>
  value.tasks.filter((task) => task.status === 'completed');

const rebuildTaskList = (incomplete: Task[], completed: Task[]): TaskListValue => ({
  tasks: [...incomplete, ...completed],
});

const parseOrderedTaskIds = (value: unknown): Result<string[], TaskListDecisionError> => {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    return { ok: false, error: { kind: 'invalid-reorder' } };
  }
  return {
    ok: true,
    value: value.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
  };
};

export const applyTaskListCommand = (
  current: TaskListValue,
  command: TaskListCommand,
  context: { taskId?: string; nowEpochMs: number }
): Result<TaskListValue, TaskListDecisionError> => {
  if (command.kind === 'update-estimate' || command.kind === 'set-status') {
    return { ok: false, error: { kind: 'unsupported-command' } };
  }

  if (command.kind === 'create-task') {
    const title = parseTitle(command.title);
    if (!title.ok) {
      return title;
    }
    const estimate = parseEstimate(command.originalEstimateMinutes);
    if (!estimate.ok) {
      return estimate;
    }
    if (!context.taskId) {
      return { ok: false, error: { kind: 'invalid-task-id' } };
    }
    const task: Task = {
      id: context.taskId,
      title: title.value,
      status: 'to-do',
      originalEstimateMinutes: estimate.value,
      focusedTimeSeconds: 0,
      createdAtEpochMs: context.nowEpochMs,
      updatedAtEpochMs: context.nowEpochMs,
    };
    const next = cloneTaskListValue(current);
    const completed = completedTasks(next);
    next.tasks = [...incompleteTasks(next), task, ...completed];
    return { ok: true, value: next };
  }

  if (command.kind === 'update-title') {
    const taskId = parseTaskId(command.taskId);
    if (!taskId.ok) {
      return taskId;
    }
    const title = parseTitle(command.title);
    if (!title.ok) {
      return title;
    }
    const index = findTaskIndex(current, taskId.value);
    if (index < 0) {
      return { ok: false, error: { kind: 'task-not-found', taskId: taskId.value } };
    }
    const existing = current.tasks[index];
    if (!isIncompleteTask(existing)) {
      return { ok: false, error: { kind: 'task-not-incomplete', taskId: taskId.value } };
    }
    const next = cloneTaskListValue(current);
    next.tasks[index] = {
      ...cloneTask(existing),
      title: title.value,
      updatedAtEpochMs: context.nowEpochMs,
    };
    return { ok: true, value: next };
  }

  if (command.kind === 'reorder-tasks') {
    const orderedTaskIds = parseOrderedTaskIds(command.orderedTaskIds);
    if (!orderedTaskIds.ok) {
      return orderedTaskIds;
    }
    const incomplete = incompleteTasks(current);
    const incompleteIds = incomplete.map((task) => task.id);
    if (
      orderedTaskIds.value.length !== incompleteIds.length ||
      !orderedTaskIds.value.every((id) => incompleteIds.includes(id)) ||
      new Set(orderedTaskIds.value).size !== orderedTaskIds.value.length
    ) {
      return { ok: false, error: { kind: 'invalid-reorder' } };
    }
    const byId = new Map(incomplete.map((task) => [task.id, task]));
    const reordered = orderedTaskIds.value.map((id) => byId.get(id)!);
    return { ok: true, value: rebuildTaskList(reordered, completedTasks(current)) };
  }

  if (command.kind === 'complete-task') {
    const taskId = parseTaskId(command.taskId);
    if (!taskId.ok) {
      return taskId;
    }
    const index = findTaskIndex(current, taskId.value);
    if (index < 0) {
      return { ok: false, error: { kind: 'task-not-found', taskId: taskId.value } };
    }
    const existing = current.tasks[index];
    if (!isIncompleteTask(existing)) {
      return { ok: false, error: { kind: 'task-not-incomplete', taskId: taskId.value } };
    }
    const completedTask: Task = {
      ...cloneTask(existing),
      status: 'completed',
      updatedAtEpochMs: context.nowEpochMs,
      completedAtEpochMs: context.nowEpochMs,
    };
    const remainingIncomplete = incompleteTasks(current).filter((task) => task.id !== taskId.value);
    const completed = [...completedTasks(current), completedTask];
    return { ok: true, value: rebuildTaskList(remainingIncomplete, completed) };
  }

  if (command.kind === 'delete-task') {
    const taskId = parseTaskId(command.taskId);
    if (!taskId.ok) {
      return taskId;
    }
    if (findTaskIndex(current, taskId.value) < 0) {
      return { ok: false, error: { kind: 'task-not-found', taskId: taskId.value } };
    }
    const next = cloneTaskListValue(current);
    next.tasks = next.tasks.filter((task) => task.id !== taskId.value);
    return { ok: true, value: next };
  }

  return { ok: false, error: { kind: 'unsupported-command' } };
};
