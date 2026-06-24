import { describe, expect, it } from 'vitest';
import {
  computeIntervalElapsedSeconds,
  computeSelectedTaskRemainingMinutes,
  decideActivateTask,
  decideAttributeFocusedTime,
  isFocusAttributionPhase,
} from './attributeFocusedTime';
import { createDefaultTaskListValue } from './taskListDocument';
import { applyTaskListCommand } from './decide';

const createTask = (id: string, estimate = 30) => {
  const created = applyTaskListCommand(
    createDefaultTaskListValue(),
    { kind: 'create-task', title: `Task ${id}`, originalEstimateMinutes: estimate },
    { taskId: id, nowEpochMs: 1_000 }
  );
  if (!created.ok) {
    throw new Error('expected task creation');
  }
  return created.value;
};

describe('attributeFocusedTime', () => {
  it('identifies focus-block as the only attribution phase', () => {
    expect(isFocusAttributionPhase('focus-block')).toBe(true);
    expect(isFocusAttributionPhase('time-out')).toBe(false);
    expect(isFocusAttributionPhase('recess')).toBe(false);
  });

  it('attributes exact seconds and marks to-do tasks in-progress', () => {
    const taskList = createTask('task-1');
    const attributed = decideAttributeFocusedTime(taskList, 'task-1', 90, 2_000);
    expect(attributed.ok).toBe(true);
    if (attributed.ok) {
      const task = attributed.value.tasks[0];
      expect(task?.focusedTimeSeconds).toBe(90);
      expect(task?.status).toBe('in-progress');
    }
  });

  it('activates incomplete tasks', () => {
    const taskList = createTask('task-1');
    const activated = decideActivateTask(taskList, 'task-1', 2_000);
    expect(activated.ok).toBe(true);
    if (activated.ok) {
      expect(activated.value.tasks[0]?.status).toBe('in-progress');
    }
  });

  it('computes remaining minutes across selected tasks', () => {
    const taskList = createTask('task-1', 60);
    const attributed = decideAttributeFocusedTime(taskList, 'task-1', 15 * 60, 2_000);
    if (!attributed.ok) {
      throw new Error('expected attribution');
    }
    expect(computeSelectedTaskRemainingMinutes(attributed.value, ['task-1'])).toBe(45);
    expect(computeSelectedTaskRemainingMinutes(attributed.value, [])).toBeNull();
  });

  it('floors elapsed interval seconds at mid-second boundaries', () => {
    expect(computeIntervalElapsedSeconds(1_000, 3_500)).toBe(2);
    expect(computeIntervalElapsedSeconds(1_000, 999)).toBe(0);
  });
});
