import { describe, expect, it } from 'vitest';
import { applyTaskListCommand } from '@/modules/task-list';
import { createDefaultTaskListValue } from '@/modules/task-list/taskListDocument';
import { emptyTaskSelectionState } from './workRhythmDocument';
import { decideSelectTasks, decideSetActiveTask, settleActiveTaskInterval } from './taskSelection';
import type { WorkRhythmFocusBlock } from './workRhythmDocument';

const baseFocus = (overrides: Partial<WorkRhythmFocusBlock> = {}): WorkRhythmFocusBlock => ({
  phase: 'focus-block',
  sessionId: 'ws-1',
  originalGoalSeconds: 60 * 60,
  sessionStartedAtEpochMs: 1_000_000,
  remainingWorkSessionSeconds: 60 * 60,
  settledRemainingWorkSessionSeconds: 60 * 60,
  energy: 'steady',
  momentum: 'steady',
  focusBlockIndex: 0,
  focusBlockStartedAtEpochMs: 1_000_000,
  focusDeadlineAtEpochMs: 1_000_000 + 25 * 60 * 1000,
  focusDurationSeconds: 25 * 60,
  isFinalFocus: false,
  wasExtension: false,
  schedulerReasons: [{ code: 'base-cadence', focusDeltaMinutes: 25, recessDeltaMinutes: 5 }],
  focusBlockStreak: 0,
  settlementSegment: 0,
  originalGoalPermanentlyComplete: false,
  isWorkSessionExtension: false,
  extensionTrancheSeconds: 0,
  extensionBaselineCumulativeSeconds: 0,
  extensionBaselineCount: 0,
  ...emptyTaskSelectionState(),
  ...overrides,
});

const taskListWithTasks = () => {
  let value = createDefaultTaskListValue();
  for (const id of ['task-a', 'task-b']) {
    const created = applyTaskListCommand(
      value,
      { kind: 'create-task', title: id, originalEstimateMinutes: 30 },
      { taskId: id, nowEpochMs: 1_000 }
    );
    if (!created.ok) {
      throw new Error('expected task');
    }
    value = created.value;
  }
  return value;
};

describe('taskSelection decisions', () => {
  it('selects only incomplete tasks', () => {
    const selected = decideSelectTasks(
      baseFocus(),
      taskListWithTasks(),
      ['task-a', 'task-b'],
      1_100_000
    );
    expect(selected.ok).toBe(true);
    if (selected.ok) {
      expect(selected.value.nextValue.selectedTaskIds).toEqual(['task-a', 'task-b']);
    }
  });

  it('settles and clears active task when deselected', () => {
    const focus = baseFocus({
      selectedTaskIds: ['task-a'],
      activeTaskId: 'task-a',
      activeTaskIntervalStartedAtEpochMs: 1_000_000,
    });
    const selected = decideSelectTasks(focus, taskListWithTasks(), [], 1_090_000);
    expect(selected.ok).toBe(true);
    if (selected.ok) {
      expect(selected.value.nextValue.activeTaskId).toBeNull();
      expect(selected.value.attribution?.seconds).toBe(90);
      expect(selected.value.nextTaskList.tasks[0]?.focusedTimeSeconds).toBe(90);
    }
  });

  it('settles old task before activating a new one', () => {
    const focus = baseFocus({
      selectedTaskIds: ['task-a', 'task-b'],
      activeTaskId: 'task-a',
      activeTaskIntervalStartedAtEpochMs: 1_000_000,
    });
    const activated = decideSetActiveTask(focus, taskListWithTasks(), 'task-b', 1_045_000);
    expect(activated.ok).toBe(true);
    if (activated.ok) {
      expect(activated.value.attribution?.taskId).toBe('task-a');
      expect(activated.value.attribution?.seconds).toBe(45);
      expect(activated.value.nextValue.activeTaskId).toBe('task-b');
      expect(activated.value.nextValue.activeTaskIntervalStartedAtEpochMs).toBe(1_045_000);
    }
  });

  it('rejects active tasks that are not selected', () => {
    const result = decideSetActiveTask(baseFocus(), taskListWithTasks(), 'task-a', 1_000_000);
    expect(result).toEqual({ ok: false, error: { kind: 'task-not-selected', taskId: 'task-a' } });
  });

  it('does not attribute during non-focus phases', () => {
    const timeOut = {
      ...baseFocus(),
      phase: 'time-out' as const,
      settledRemainingFocusSeconds: 900,
      settledRemainingWorkSessionSeconds: 3_000,
      timeOutStartedAtEpochMs: 1_000_500,
      lastReportedFiveMinuteBoundary: 0,
      momentumLoweredDuringTimeOut: false,
      activeTaskId: 'task-a',
      activeTaskIntervalStartedAtEpochMs: 1_000_000,
      selectedTaskIds: ['task-a'],
    };
    const settled = settleActiveTaskInterval(timeOut, taskListWithTasks(), 1_000_600);
    expect(settled.ok).toBe(true);
    if (settled.ok) {
      expect(settled.value.attribution).toBeNull();
    }
  });
});
