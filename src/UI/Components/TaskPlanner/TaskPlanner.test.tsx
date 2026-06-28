import { describe, expect, it } from 'vitest';
import type { TaskProjection } from '@/modules/task-list';
import { planTasksForFocus, sortTaskIdsByManualOrder } from '@/modules/task-planner';

const task = (id: string, remainingWorkSeconds: number): TaskProjection => ({
  id,
  title: `Task ${id}`,
  status: 'to-do',
  originalEstimateMinutes: 30,
  focusedTimeSeconds: 0,
  remainingWorkSeconds,
});

describe('TaskPlanner edits', () => {
  it('keeps edited selections in manual task list order', () => {
    const incompleteTasks = [task('b', 900), task('a', 900), task('c', 900)];
    const proposal = planTasksForFocus({
      incompleteTasks,
      scheduledFocusSeconds: 1800,
    });
    const editedSelection = ['a', 'c'];

    expect(proposal.proposedTaskIds).toEqual(['b', 'a']);
    expect(sortTaskIdsByManualOrder(editedSelection, incompleteTasks)).toEqual(['a', 'c']);
  });

  it('supports removing tasks from the advisory proposal', () => {
    const incompleteTasks = [task('a', 1800), task('b', 900)];
    const proposal = planTasksForFocus({
      incompleteTasks,
      scheduledFocusSeconds: 1800,
    });
    const editedSelection = proposal.proposedTaskIds.filter((taskId) => taskId !== 'b');

    expect(editedSelection).toEqual(['a']);
  });

  it('supports adding tasks back in manual order', () => {
    const incompleteTasks = [task('a', 900), task('b', 900), task('c', 900)];
    const editedSelection = sortTaskIdsByManualOrder(['c', 'a'], incompleteTasks);

    expect(editedSelection).toEqual(['a', 'c']);
  });
});
