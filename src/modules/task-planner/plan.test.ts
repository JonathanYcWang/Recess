import { describe, expect, it } from 'vitest';
import type { TaskProjection } from '@/modules/task-list';
import { planTasksForFocus, sortTaskIdsByManualOrder } from './plan';

const task = (
  id: string,
  remainingWorkSeconds: number,
  overrides?: Partial<TaskProjection>
): TaskProjection => ({
  id,
  title: `Task ${id}`,
  status: 'to-do',
  originalEstimateMinutes: 30,
  focusedTimeSeconds: 0,
  remainingWorkSeconds,
  ...overrides,
});

describe('planTasksForFocus', () => {
  it('returns an empty proposal for an empty task list', () => {
    expect(planTasksForFocus({ incompleteTasks: [], scheduledFocusSeconds: 3600 })).toEqual({
      proposedTaskIds: [],
      totalDerivedRemainingSeconds: 0,
    });
  });

  it('returns an empty proposal when scheduled focus is zero', () => {
    expect(
      planTasksForFocus({
        incompleteTasks: [task('a', 1800)],
        scheduledFocusSeconds: 0,
      })
    ).toEqual({
      proposedTaskIds: [],
      totalDerivedRemainingSeconds: 0,
    });
  });

  it('uses derived remaining work without rewriting original estimates', () => {
    const overrun = task('overrun', 0, {
      originalEstimateMinutes: 30,
      focusedTimeSeconds: 2400,
    });
    const result = planTasksForFocus({
      incompleteTasks: [overrun, task('next', 1800, { originalEstimateMinutes: 45 })],
      scheduledFocusSeconds: 1800,
    });

    expect(result).toEqual({
      proposedTaskIds: ['overrun', 'next'],
      totalDerivedRemainingSeconds: 1800,
    });
    expect(overrun.originalEstimateMinutes).toBe(30);
  });

  it('includes overrun tasks with zero derived remaining before coverage is met', () => {
    const result = planTasksForFocus({
      incompleteTasks: [task('overrun-a', 0), task('overrun-b', 0), task('work', 1800)],
      scheduledFocusSeconds: 1800,
    });

    expect(result.proposedTaskIds).toEqual(['overrun-a', 'overrun-b', 'work']);
    expect(result.totalDerivedRemainingSeconds).toBe(1800);
  });

  it('stops once positive derived remaining covers scheduled focus exactly', () => {
    const result = planTasksForFocus({
      incompleteTasks: [task('a', 900), task('b', 900), task('c', 1800)],
      scheduledFocusSeconds: 1800,
    });

    expect(result).toEqual({
      proposedTaskIds: ['a', 'b'],
      totalDerivedRemainingSeconds: 1800,
    });
  });

  it('includes the first task when it alone covers scheduled focus', () => {
    const result = planTasksForFocus({
      incompleteTasks: [task('a', 3600), task('b', 1800)],
      scheduledFocusSeconds: 1800,
    });

    expect(result).toEqual({
      proposedTaskIds: ['a'],
      totalDerivedRemainingSeconds: 3600,
    });
  });

  it('returns all incomplete tasks when they cannot cover scheduled focus', () => {
    const result = planTasksForFocus({
      incompleteTasks: [task('a', 600), task('b', 300)],
      scheduledFocusSeconds: 3600,
    });

    expect(result).toEqual({
      proposedTaskIds: ['a', 'b'],
      totalDerivedRemainingSeconds: 900,
    });
  });

  it('walks tasks in manual list order without reordering', () => {
    const result = planTasksForFocus({
      incompleteTasks: [task('third', 300), task('first', 1200), task('second', 600)],
      scheduledFocusSeconds: 1500,
    });

    expect(result.proposedTaskIds).toEqual(['third', 'first']);
    expect(result.totalDerivedRemainingSeconds).toBe(1500);
  });

  it('does not invent tasks beyond the incomplete list', () => {
    const incompleteTasks = [task('only', 900)];
    const result = planTasksForFocus({
      incompleteTasks,
      scheduledFocusSeconds: 7200,
    });

    expect(result.proposedTaskIds).toEqual(['only']);
    expect(
      result.proposedTaskIds.every((id) => incompleteTasks.some((entry) => entry.id === id))
    ).toBe(true);
  });

  it('sorts edited selections by manual task list order', () => {
    const incompleteTasks = [task('b', 900), task('a', 900), task('c', 900)];
    expect(sortTaskIdsByManualOrder(['c', 'a'], incompleteTasks)).toEqual(['a', 'c']);
  });
});
