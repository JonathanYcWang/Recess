import type { Result } from '@/runtime/persistence/types';
import {
  applyTaskListCommand,
  computeIntervalElapsedSeconds,
  decideActivateTask,
  decideAttributeFocusedTime,
  isFocusAttributionPhase,
  type TaskListValue,
} from '@/modules/task-list';
import { isIncompleteTask } from '@/modules/task-list/taskListDocument';
import type {
  WorkRhythmFocusBlock,
  WorkRhythmTimeOut,
  WorkRhythmValue,
} from './workRhythmDocument';
import {
  createTaskFocusedTimeAttributedFact,
  taskFocusedTimeAttributedFactId,
} from './taskFocusedTimeAttributed';
import type { WorkHistoryFact } from '@/modules/work-history';
import { createTaskCompletedFact, taskCompletedFactId } from '@/modules/task-list/taskCompleted';

export type TaskSelectionPhaseValue = WorkRhythmFocusBlock | WorkRhythmTimeOut;

export type TaskSelectionState = {
  selectedTaskIds: string[];
  activeTaskId: string | null;
  activeTaskIntervalStartedAtEpochMs: number | null;
};

export const emptyTaskSelection = (): TaskSelectionState => ({
  selectedTaskIds: [],
  activeTaskId: null,
  activeTaskIntervalStartedAtEpochMs: null,
});

export const hasTaskSelection = (value: WorkRhythmValue): value is TaskSelectionPhaseValue =>
  value.phase === 'focus-block' || value.phase === 'time-out';

export type TaskSelectionError =
  | { kind: 'invalid-phase-for-task-selection' }
  | { kind: 'invalid-task-ids' }
  | { kind: 'invalid-active-task' }
  | { kind: 'task-not-found'; taskId: string }
  | { kind: 'task-not-incomplete'; taskId: string }
  | { kind: 'task-not-selected'; taskId: string };

export type TaskAttribution = {
  taskId: string;
  seconds: number;
  intervalStartedAt: number;
  intervalEndedAt: number;
  fact: WorkHistoryFact;
};

const parseTaskIds = (value: unknown): Result<string[], TaskSelectionError> => {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    return { ok: false, error: { kind: 'invalid-task-ids' } };
  }
  const taskIds = value.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (new Set(taskIds).size !== taskIds.length) {
    return { ok: false, error: { kind: 'invalid-task-ids' } };
  }
  return { ok: true, value: taskIds };
};

const parseActiveTaskId = (value: unknown): Result<string | null, TaskSelectionError> => {
  if (value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error: { kind: 'invalid-active-task' } };
  }
  return { ok: true, value: value.trim() };
};

const validateIncompleteTaskIds = (
  taskList: TaskListValue,
  taskIds: readonly string[]
): Result<void, TaskSelectionError> => {
  for (const taskId of taskIds) {
    const task = taskList.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      return { ok: false, error: { kind: 'task-not-found', taskId } };
    }
    if (!isIncompleteTask(task)) {
      return { ok: false, error: { kind: 'task-not-incomplete', taskId } };
    }
  }
  return { ok: true, value: undefined };
};

export const settleActiveTaskInterval = (
  phase: TaskSelectionPhaseValue,
  taskList: TaskListValue,
  nowEpochMs: number
): Result<
  { nextTaskList: TaskListValue; attribution: TaskAttribution | null },
  TaskSelectionError
> => {
  if (
    !isFocusAttributionPhase(phase.phase) ||
    !phase.activeTaskId ||
    phase.activeTaskIntervalStartedAtEpochMs === null
  ) {
    return { ok: true, value: { nextTaskList: taskList, attribution: null } };
  }

  const intervalStartedAt = phase.activeTaskIntervalStartedAtEpochMs;
  const seconds = computeIntervalElapsedSeconds(intervalStartedAt, nowEpochMs);
  if (seconds === 0) {
    return { ok: true, value: { nextTaskList: taskList, attribution: null } };
  }

  const attributed = decideAttributeFocusedTime(taskList, phase.activeTaskId, seconds, nowEpochMs);
  if (!attributed.ok) {
    if (attributed.error.kind === 'task-not-found') {
      return { ok: false, error: attributed.error };
    }
    return { ok: false, error: { kind: 'invalid-task-ids' } };
  }

  const fact = createTaskFocusedTimeAttributedFact({
    factId: taskFocusedTimeAttributedFactId(
      phase.sessionId,
      phase.activeTaskId,
      intervalStartedAt,
      nowEpochMs
    ),
    recordedAt: nowEpochMs,
    workSessionId: phase.sessionId,
    taskId: phase.activeTaskId,
    seconds,
    attributedAt: nowEpochMs,
    focusBlockIndex: phase.focusBlockIndex,
    intervalStartedAt,
    intervalEndedAt: nowEpochMs,
  });

  return {
    ok: true,
    value: {
      nextTaskList: attributed.value,
      attribution: {
        taskId: phase.activeTaskId,
        seconds,
        intervalStartedAt,
        intervalEndedAt: nowEpochMs,
        fact,
      },
    },
  };
};

export const withSettledInterval = (
  phase: TaskSelectionPhaseValue,
  options?: { clearActive?: boolean; restartInterval?: boolean; nowEpochMs?: number }
): TaskSelectionPhaseValue => {
  const nowEpochMs = options?.nowEpochMs ?? Date.now();
  const clearActive = options?.clearActive ?? false;
  const restartInterval = options?.restartInterval ?? false;
  const activeTaskId = clearActive ? null : phase.activeTaskId;
  let activeTaskIntervalStartedAtEpochMs: number | null = null;
  if (!clearActive && activeTaskId) {
    if (restartInterval && phase.phase === 'focus-block') {
      activeTaskIntervalStartedAtEpochMs = nowEpochMs;
    }
  }
  return {
    ...phase,
    activeTaskId,
    activeTaskIntervalStartedAtEpochMs,
  };
};

export const decideSelectTasks = (
  current: WorkRhythmValue,
  taskList: TaskListValue,
  taskIdsInput: unknown,
  nowEpochMs: number
): Result<
  {
    nextValue: TaskSelectionPhaseValue;
    nextTaskList: TaskListValue;
    attribution: TaskAttribution | null;
  },
  TaskSelectionError
> => {
  if (!hasTaskSelection(current)) {
    return { ok: false, error: { kind: 'invalid-phase-for-task-selection' } };
  }

  const taskIds = parseTaskIds(taskIdsInput);
  if (!taskIds.ok) {
    return taskIds;
  }
  const validated = validateIncompleteTaskIds(taskList, taskIds.value);
  if (!validated.ok) {
    return validated;
  }

  let nextTaskList = taskList;
  let attribution: TaskAttribution | null = null;
  const activeDeselected =
    current.activeTaskId !== null && !taskIds.value.includes(current.activeTaskId);

  if (activeDeselected) {
    const settled = settleActiveTaskInterval(current, nextTaskList, nowEpochMs);
    if (!settled.ok) {
      return settled;
    }
    nextTaskList = settled.value.nextTaskList;
    attribution = settled.value.attribution;
  }

  const nextValue: TaskSelectionPhaseValue = {
    ...current,
    selectedTaskIds: [...taskIds.value],
    activeTaskId: activeDeselected ? null : current.activeTaskId,
    activeTaskIntervalStartedAtEpochMs: activeDeselected
      ? null
      : current.activeTaskIntervalStartedAtEpochMs,
  };

  return { ok: true, value: { nextValue, nextTaskList, attribution } };
};

export const decideSetActiveTask = (
  current: WorkRhythmValue,
  taskList: TaskListValue,
  taskIdInput: unknown,
  nowEpochMs: number
): Result<
  {
    nextValue: TaskSelectionPhaseValue;
    nextTaskList: TaskListValue;
    attribution: TaskAttribution | null;
  },
  TaskSelectionError
> => {
  if (!hasTaskSelection(current)) {
    return { ok: false, error: { kind: 'invalid-phase-for-task-selection' } };
  }

  const taskId = parseActiveTaskId(taskIdInput);
  if (!taskId.ok) {
    return taskId;
  }

  if (taskId.value !== null) {
    if (!current.selectedTaskIds.includes(taskId.value)) {
      return { ok: false, error: { kind: 'task-not-selected', taskId: taskId.value } };
    }
    const task = taskList.tasks.find((entry) => entry.id === taskId.value);
    if (!task) {
      return { ok: false, error: { kind: 'task-not-found', taskId: taskId.value } };
    }
    if (!isIncompleteTask(task)) {
      return { ok: false, error: { kind: 'task-not-incomplete', taskId: taskId.value } };
    }
  }

  let nextTaskList = taskList;
  let attribution: TaskAttribution | null = null;
  const shouldSettle =
    current.activeTaskId !== null &&
    current.activeTaskId !== taskId.value &&
    current.activeTaskIntervalStartedAtEpochMs !== null &&
    isFocusAttributionPhase(current.phase);

  if (shouldSettle) {
    const settled = settleActiveTaskInterval(current, nextTaskList, nowEpochMs);
    if (!settled.ok) {
      return settled;
    }
    nextTaskList = settled.value.nextTaskList;
    attribution = settled.value.attribution;
  }

  let activeTaskIntervalStartedAtEpochMs: number | null = null;
  if (taskId.value !== null && current.phase === 'focus-block') {
    activeTaskIntervalStartedAtEpochMs = nowEpochMs;
    const activated = decideActivateTask(nextTaskList, taskId.value, nowEpochMs);
    if (!activated.ok) {
      if (activated.error.kind === 'task-not-found') {
        return { ok: false, error: activated.error };
      }
      return { ok: false, error: { kind: 'task-not-incomplete', taskId: taskId.value } };
    }
    nextTaskList = activated.value;
  }

  const nextValue: TaskSelectionPhaseValue = {
    ...current,
    activeTaskId: taskId.value,
    activeTaskIntervalStartedAtEpochMs,
  };

  return { ok: true, value: { nextValue, nextTaskList, attribution } };
};

export const findNextIncompleteSelectedTaskId = (
  taskList: TaskListValue,
  selectedTaskIds: readonly string[],
  afterTaskId?: string
): string | null => {
  const startAt = afterTaskId === undefined ? 0 : selectedTaskIds.indexOf(afterTaskId) + 1;
  if (startAt < 0) {
    return null;
  }
  for (let index = startAt; index < selectedTaskIds.length; index += 1) {
    const candidateId = selectedTaskIds[index];
    const task = taskList.tasks.find((entry) => entry.id === candidateId);
    if (task && isIncompleteTask(task)) {
      return candidateId;
    }
  }
  return null;
};

export const decideCompleteTask = (
  current: WorkRhythmValue,
  taskList: TaskListValue,
  taskIdInput: unknown,
  nowEpochMs: number
): Result<
  {
    nextValue: TaskSelectionPhaseValue;
    nextTaskList: TaskListValue;
    attribution: TaskAttribution | null;
    taskCompletedFact: WorkHistoryFact;
  },
  TaskSelectionError
> => {
  if (!hasTaskSelection(current)) {
    return { ok: false, error: { kind: 'invalid-phase-for-task-selection' } };
  }

  const taskId = parseActiveTaskId(taskIdInput);
  if (!taskId.ok || taskId.value === null) {
    return { ok: false, error: { kind: 'invalid-active-task' } };
  }

  if (!current.selectedTaskIds.includes(taskId.value)) {
    return { ok: false, error: { kind: 'task-not-selected', taskId: taskId.value } };
  }

  const existing = taskList.tasks.find((entry) => entry.id === taskId.value);
  if (!existing) {
    return { ok: false, error: { kind: 'task-not-found', taskId: taskId.value } };
  }
  if (!isIncompleteTask(existing)) {
    return { ok: false, error: { kind: 'task-not-incomplete', taskId: taskId.value } };
  }

  const isActive = current.activeTaskId === taskId.value;
  let nextTaskList = taskList;
  let attribution: TaskAttribution | null = null;

  if (isActive) {
    const settled = settleActiveTaskInterval(current, nextTaskList, nowEpochMs);
    if (!settled.ok) {
      return settled;
    }
    nextTaskList = settled.value.nextTaskList;
    attribution = settled.value.attribution;
  }

  const completed = applyTaskListCommand(
    nextTaskList,
    { kind: 'complete-task', taskId: taskId.value },
    { nowEpochMs }
  );
  if (!completed.ok) {
    if (completed.error.kind === 'task-not-found') {
      return { ok: false, error: completed.error };
    }
    return { ok: false, error: { kind: 'task-not-incomplete', taskId: taskId.value } };
  }
  nextTaskList = completed.value;

  const remainingSelectedIds = current.selectedTaskIds.filter((id) => id !== taskId.value);
  let activeTaskId = current.activeTaskId;
  let activeTaskIntervalStartedAtEpochMs = current.activeTaskIntervalStartedAtEpochMs;

  if (isActive) {
    const nextActiveId = findNextIncompleteSelectedTaskId(nextTaskList, remainingSelectedIds);
    activeTaskId = nextActiveId;
    activeTaskIntervalStartedAtEpochMs = null;
    if (nextActiveId !== null && current.phase === 'focus-block') {
      activeTaskIntervalStartedAtEpochMs = nowEpochMs;
      const activated = decideActivateTask(nextTaskList, nextActiveId, nowEpochMs);
      if (!activated.ok) {
        if (activated.error.kind === 'task-not-found') {
          return { ok: false, error: activated.error };
        }
        return { ok: false, error: { kind: 'task-not-incomplete', taskId: nextActiveId } };
      }
      nextTaskList = activated.value;
    }
  }

  const nextValue: TaskSelectionPhaseValue = {
    ...current,
    selectedTaskIds: remainingSelectedIds,
    activeTaskId,
    activeTaskIntervalStartedAtEpochMs,
  };

  const completedTask = nextTaskList.tasks.find((entry) => entry.id === taskId.value);
  if (!completedTask) {
    return { ok: false, error: { kind: 'task-not-found', taskId: taskId.value } };
  }

  return {
    ok: true,
    value: {
      nextValue,
      nextTaskList,
      attribution,
      taskCompletedFact: createTaskCompletedFact({
        factId: taskCompletedFactId(taskId.value),
        recordedAt: nowEpochMs,
        taskId: taskId.value,
        workSessionId: current.sessionId,
        originalEstimateMinutes: completedTask.originalEstimateMinutes,
        totalFocusedTimeSeconds: completedTask.focusedTimeSeconds,
        completedAtEpochMs: nowEpochMs,
      }),
    },
  };
};

export const preparePhaseAfterTaskSettlement = (
  phase: TaskSelectionPhaseValue,
  nowEpochMs: number,
  options?: { enteringTimeOut?: boolean }
): TaskSelectionPhaseValue => {
  if (options?.enteringTimeOut) {
    return {
      ...phase,
      activeTaskIntervalStartedAtEpochMs: null,
    };
  }
  if (phase.phase === 'focus-block' && phase.activeTaskId) {
    return {
      ...phase,
      activeTaskIntervalStartedAtEpochMs: nowEpochMs,
    };
  }
  return {
    ...phase,
    activeTaskIntervalStartedAtEpochMs: null,
  };
};
