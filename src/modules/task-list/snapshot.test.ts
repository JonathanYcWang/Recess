import { describe, expect, it } from 'vitest';
import { applyTaskListCommand } from './decide';
import { projectTaskListSnapshot } from './snapshot';
import { createDefaultTaskListValue } from './taskListDocument';

describe('projectTaskListSnapshot', () => {
  it('returns ordered incomplete tasks and completed tasks separately', () => {
    let value = createDefaultTaskListValue();
    for (const [index, title] of ['First', 'Second'].entries()) {
      const created = applyTaskListCommand(
        value,
        { kind: 'create-task', title, originalEstimateMinutes: 15 },
        { taskId: `task-${index + 1}`, nowEpochMs: 100 + index }
      );
      if (!created.ok) {
        throw new Error('expected create');
      }
      value = created.value;
    }
    const completed = applyTaskListCommand(
      value,
      { kind: 'complete-task', taskId: 'task-1' },
      { nowEpochMs: 200 }
    );
    if (!completed.ok) {
      throw new Error('expected complete');
    }
    const snapshot = projectTaskListSnapshot(completed.value);
    expect(snapshot.incompleteTasks.map((task) => task.id)).toEqual(['task-2']);
    expect(snapshot.completedTasks.map((task) => task.id)).toEqual(['task-1']);
    expect(snapshot.incompleteTasks[0].remainingWorkSeconds).toBe(15 * 60);
  });
});
