import type { Result } from '@/runtime/persistence/types';
import {
  cloneTask,
  cloneTaskListValue,
  isIncompleteTask,
  type TaskListValue,
} from './taskListDocument';
import { deriveRemainingWorkSeconds } from './timeEstimate';

export const isFocusAttributionPhase = (phase: string): boolean => phase === 'focus-block';

export const computeIntervalElapsedSeconds = (
  intervalStartedAtEpochMs: number,
  nowEpochMs: number
): number => Math.max(0, Math.floor((nowEpochMs - intervalStartedAtEpochMs) / 1000));

export const decideAttributeFocusedTime = (
  taskList: TaskListValue,
  taskId: string,
  seconds: number,
  nowEpochMs: number
): Result<
  TaskListValue,
  { kind: 'task-not-found'; taskId: string } | { kind: 'invalid-seconds' }
> => {
  if (!Number.isInteger(seconds) || seconds < 0) {
    return { ok: false, error: { kind: 'invalid-seconds' } };
  }
  if (seconds === 0) {
    return { ok: true, value: cloneTaskListValue(taskList) };
  }

  const index = taskList.tasks.findIndex((task) => task.id === taskId);
  if (index < 0) {
    return { ok: false, error: { kind: 'task-not-found', taskId } };
  }

  const existing = taskList.tasks[index];
  const next = cloneTaskListValue(taskList);
  next.tasks[index] = {
    ...cloneTask(existing),
    focusedTimeSeconds: existing.focusedTimeSeconds + seconds,
    status: existing.status === 'to-do' ? 'in-progress' : existing.status,
    updatedAtEpochMs: nowEpochMs,
  };
  return { ok: true, value: next };
};

export const decideActivateTask = (
  taskList: TaskListValue,
  taskId: string,
  nowEpochMs: number
): Result<
  TaskListValue,
  { kind: 'task-not-found'; taskId: string } | { kind: 'task-not-incomplete'; taskId: string }
> => {
  const index = taskList.tasks.findIndex((task) => task.id === taskId);
  if (index < 0) {
    return { ok: false, error: { kind: 'task-not-found', taskId } };
  }
  const existing = taskList.tasks[index];
  if (!isIncompleteTask(existing)) {
    return { ok: false, error: { kind: 'task-not-incomplete', taskId } };
  }
  if (existing.status === 'in-progress') {
    return { ok: true, value: cloneTaskListValue(taskList) };
  }
  const next = cloneTaskListValue(taskList);
  next.tasks[index] = {
    ...cloneTask(existing),
    status: 'in-progress',
    updatedAtEpochMs: nowEpochMs,
  };
  return { ok: true, value: next };
};

export const computeSelectedTaskDerivedRemainingSeconds = (
  taskList: TaskListValue,
  selectedTaskIds: readonly string[]
): number | null => {
  if (selectedTaskIds.length === 0) {
    return null;
  }
  let totalSeconds = 0;
  let matchedIncompleteTasks = 0;
  for (const taskId of selectedTaskIds) {
    const task = taskList.tasks.find((entry) => entry.id === taskId);
    if (!task || !isIncompleteTask(task)) {
      continue;
    }
    matchedIncompleteTasks += 1;
    totalSeconds += deriveRemainingWorkSeconds(task);
  }
  return matchedIncompleteTasks > 0 ? totalSeconds : null;
};

export const filterSelectedIncompleteTaskIds = (
  taskList: TaskListValue,
  selectedTaskIds: readonly string[]
): string[] =>
  selectedTaskIds.filter((taskId) => {
    const task = taskList.tasks.find((entry) => entry.id === taskId);
    return task !== undefined && isIncompleteTask(task);
  });

export const computeSelectedTaskRemainingMinutes = (
  taskList: TaskListValue,
  selectedTaskIds: readonly string[]
): number | null => {
  const totalSeconds = computeSelectedTaskDerivedRemainingSeconds(taskList, selectedTaskIds);
  if (totalSeconds === null) {
    return null;
  }
  return Math.ceil(totalSeconds / 60);
};
