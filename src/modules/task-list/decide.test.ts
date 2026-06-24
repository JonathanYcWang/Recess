import { describe, expect, it } from 'vitest';
import { applyTaskListCommand } from './decide';
import { createDefaultTaskListValue } from './taskListDocument';

const NOW = 1_700_000_000_000;

const createTask = (overrides?: Partial<Parameters<typeof applyTaskListCommand>[2]>) => ({
  taskId: 'task-1',
  nowEpochMs: NOW,
  ...overrides,
});

describe('applyTaskListCommand', () => {
  it('creates a to-do task with required title and valid estimate', () => {
    const result = applyTaskListCommand(
      createDefaultTaskListValue(),
      { kind: 'create-task', title: 'Write tests', originalEstimateMinutes: 30 },
      createTask()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tasks).toHaveLength(1);
      expect(result.value.tasks[0]).toMatchObject({
        id: 'task-1',
        title: 'Write tests',
        status: 'to-do',
        originalEstimateMinutes: 30,
        focusedTimeSeconds: 0,
      });
    }
  });

  it('rejects empty titles and invalid estimates', () => {
    expect(
      applyTaskListCommand(
        createDefaultTaskListValue(),
        { kind: 'create-task', title: '   ', originalEstimateMinutes: 30 },
        createTask()
      )
    ).toEqual({ ok: false, error: { kind: 'invalid-title' } });
    expect(
      applyTaskListCommand(
        createDefaultTaskListValue(),
        { kind: 'create-task', title: 'Valid', originalEstimateMinutes: 20 },
        createTask({ taskId: 'task-2' })
      )
    ).toEqual({ ok: false, error: { kind: 'invalid-estimate' } });
  });

  it('updates titles for incomplete tasks only', () => {
    const created = applyTaskListCommand(
      createDefaultTaskListValue(),
      { kind: 'create-task', title: 'Draft', originalEstimateMinutes: 15 },
      createTask()
    );
    if (!created.ok) {
      throw new Error('expected create');
    }
    const updated = applyTaskListCommand(
      created.value,
      { kind: 'update-title', taskId: 'task-1', title: 'Final title' },
      createTask()
    );
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.value.tasks[0].title).toBe('Final title');
    }
  });

  it('reorders incomplete tasks exactly', () => {
    let value = createDefaultTaskListValue();
    for (const [index, title] of ['A', 'B', 'C'].entries()) {
      const created = applyTaskListCommand(
        value,
        { kind: 'create-task', title, originalEstimateMinutes: 15 },
        createTask({ taskId: `task-${index + 1}` })
      );
      if (!created.ok) {
        throw new Error('expected create');
      }
      value = created.value;
    }
    const reordered = applyTaskListCommand(
      value,
      { kind: 'reorder-tasks', orderedTaskIds: ['task-3', 'task-1', 'task-2'] },
      createTask()
    );
    expect(reordered.ok).toBe(true);
    if (reordered.ok) {
      expect(reordered.value.tasks.map((task) => task.id)).toEqual(['task-3', 'task-1', 'task-2']);
    }
    const invalid = applyTaskListCommand(
      value,
      { kind: 'reorder-tasks', orderedTaskIds: ['task-1', 'task-2'] },
      createTask()
    );
    expect(invalid).toEqual({ ok: false, error: { kind: 'invalid-reorder' } });
  });

  it('completes tasks and moves them out of the incomplete ordering', () => {
    const created = applyTaskListCommand(
      createDefaultTaskListValue(),
      { kind: 'create-task', title: 'Ship', originalEstimateMinutes: 60 },
      createTask()
    );
    if (!created.ok) {
      throw new Error('expected create');
    }
    const completed = applyTaskListCommand(
      created.value,
      { kind: 'complete-task', taskId: 'task-1' },
      createTask({ nowEpochMs: NOW + 1 })
    );
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.value.tasks[0].status).toBe('completed');
      expect(completed.value.tasks[0].completedAtEpochMs).toBe(NOW + 1);
    }
  });

  it('rejects direct estimate and status mutations', () => {
    const created = applyTaskListCommand(
      createDefaultTaskListValue(),
      { kind: 'create-task', title: 'Immutable', originalEstimateMinutes: 45 },
      createTask()
    );
    if (!created.ok) {
      throw new Error('expected create');
    }
    expect(
      applyTaskListCommand(
        created.value,
        { kind: 'update-estimate', taskId: 'task-1', originalEstimateMinutes: 60 },
        createTask()
      )
    ).toEqual({ ok: false, error: { kind: 'unsupported-command' } });
    expect(
      applyTaskListCommand(
        created.value,
        { kind: 'set-status', taskId: 'task-1', status: 'in-progress' },
        createTask()
      )
    ).toEqual({ ok: false, error: { kind: 'unsupported-command' } });
  });

  it('deletes tasks from the operational list', () => {
    const created = applyTaskListCommand(
      createDefaultTaskListValue(),
      { kind: 'create-task', title: 'Remove me', originalEstimateMinutes: 15 },
      createTask()
    );
    if (!created.ok) {
      throw new Error('expected create');
    }
    const deleted = applyTaskListCommand(
      created.value,
      { kind: 'delete-task', taskId: 'task-1' },
      createTask()
    );
    expect(deleted.ok).toBe(true);
    if (deleted.ok) {
      expect(deleted.value.tasks).toHaveLength(0);
    }
  });
});
